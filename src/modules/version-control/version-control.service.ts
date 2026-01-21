import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commit } from '../../entities/commit.entity';
import { Branch } from '../../entities/branch.entity';
import { PullRequest } from '../../entities/pull-request.entity';
import { GitService } from '../git/git.service';
import { RepositoryService } from '../repository/repository.service';
import { ActivityService } from '../activity/activity.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import {
  CreateCommitDto,
  CreateBranchDto,
  CreatePullRequestDto,
  MergePullRequestDto,
} from './dto/version-control.dto';
import { PullRequestStatus } from '../../entities/pull-request.entity';

@Injectable()
export class VersionControlService {
  private readonly logger = new Logger(VersionControlService.name);

  constructor(
    @InjectRepository(Commit)
    private commitRepository: Repository<Commit>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(PullRequest)
    private pullRequestRepository: Repository<PullRequest>,
    private gitService: GitService,
    private repositoryService: RepositoryService,
    private activityService: ActivityService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  // ========== COMMITS ==========

  async createCommit(
    repoId: string,
    userId: string,
    createDto: CreateCommitDto,
  ): Promise<Commit> {
    const repo = await this.repositoryService.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(repo.ownerId, repo.name);

    // Get or create branch
    let branch = await this.branchRepository.findOne({
      where: { repositoryId: repoId, name: createDto.branch },
    });

    if (!branch) {
      branch = this.branchRepository.create({
        name: createDto.branch,
        repositoryId: repoId,
        isDefault: createDto.branch === 'main',
      });
      await this.branchRepository.save(branch);
    }

    // Create commit using Git service
    const commitSha = await this.gitService.createCommit(
      repoPath,
      createDto.message,
      {
        name: userId,
        email: `${userId}@gitcore.local`,
      },
      createDto.files,
    );

    // Save commit to database
    const commit = this.commitRepository.create({
      sha: commitSha,
      message: createDto.message,
      description: createDto.description,
      authorId: userId,
      repositoryId: repoId,
      branchId: branch.id,
      tree: await this.gitService.getFileTree(repoPath, createDto.branch),
      changes: { files: createDto.files.map((f) => f.path) },
      committedAt: new Date(),
    });

    const savedCommit = await this.commitRepository.save(commit);

    // Update branch head
    branch.headCommitSha = commitSha;
    await this.branchRepository.save(branch);

    // Track activity
    await this.activityService.trackActivity(userId, repoId, 'commit');

    // Emit WebSocket event
    this.webSocketGateway.emitCommit(repoId, {
      sha: commitSha,
      message: createDto.message,
      author: userId,
    });

    return savedCommit;
  }

  async getCommits(
    repoId: string,
    branch?: string,
    limit: number = 50,
  ): Promise<Commit[]> {
    const query = this.commitRepository
      .createQueryBuilder('commit')
      .leftJoinAndSelect('commit.author', 'author')
      .where('commit.repositoryId = :repoId', { repoId })
      .orderBy('commit.committedAt', 'DESC')
      .limit(limit);

    if (branch) {
      query
        .leftJoin('commit.branch', 'branch')
        .andWhere('branch.name = :branch', { branch });
    }

    return query.getMany();
  }

  async getCommit(repoId: string, sha: string): Promise<Commit> {
    const commit = await this.commitRepository.findOne({
      where: { repositoryId: repoId, sha },
      relations: ['author', 'branch'],
    });

    if (!commit) {
      throw new NotFoundException('Commit not found');
    }

    return commit;
  }

  // ========== BRANCHES ==========

  async createBranch(
    repoId: string,
    userId: string,
    createDto: CreateBranchDto,
  ): Promise<Branch> {
    const repo = await this.repositoryService.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(repo.ownerId, repo.name);

    // Check if branch already exists
    const existing = await this.branchRepository.findOne({
      where: { repositoryId: repoId, name: createDto.name },
    });

    if (existing) {
      throw new BadRequestException('Branch already exists');
    }

    // Create branch in Git
    await this.gitService.createBranch(repoPath, createDto.name);

    // Save branch to database
    const branch = this.branchRepository.create({
      name: createDto.name,
      repositoryId: repoId,
      headCommitSha: createDto.fromBranch
        ? await this.getBranchHead(repoId, createDto.fromBranch)
        : null,
    });

    const savedBranch = await this.branchRepository.save(branch);

    // Track activity
    await this.activityService.trackActivity(userId, repoId, 'branch_create');

    return savedBranch;
  }

  async getBranches(repoId: string): Promise<Branch[]> {
    return await this.branchRepository.find({
      where: { repositoryId: repoId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getBranch(repoId: string, branchName: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { repositoryId: repoId, name: branchName },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async deleteBranch(repoId: string, branchName: string): Promise<void> {
    const branch = await this.getBranch(repoId, branchName);

    if (branch.isDefault) {
      throw new BadRequestException('Cannot delete default branch');
    }

    await this.branchRepository.remove(branch);
  }

  private async getBranchHead(repoId: string, branchName: string): Promise<string | null> {
    const branch = await this.branchRepository.findOne({
      where: { repositoryId: repoId, name: branchName },
    });
    return branch?.headCommitSha || null;
  }

  // ========== DIFFS ==========

  async getDiff(
    repoId: string,
    from: string,
    to: string,
  ): Promise<{ files: any[]; stats: any }> {
    const repo = await this.repositoryService.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(repo.ownerId, repo.name);

    return await this.gitService.getDiff(repoPath, from, to);
  }

  // ========== PULL REQUESTS ==========

  async createPullRequest(
    repoId: string,
    userId: string,
    createDto: CreatePullRequestDto,
  ): Promise<PullRequest> {
    const repo = await this.repositoryService.findById(repoId);

    // Verify branches exist
    const sourceBranch = await this.getBranch(repoId, createDto.sourceBranch);
    const targetBranch = await this.getBranch(repoId, createDto.targetBranch);

    if (sourceBranch.name === targetBranch.name) {
      throw new BadRequestException('Source and target branches must be different');
    }

    // Get next PR number
    const lastPR = await this.pullRequestRepository.findOne({
      where: { repositoryId: repoId },
      order: { number: 'DESC' },
    });
    const nextNumber = lastPR ? lastPR.number + 1 : 1;

    // Get diff between branches
    const diff = await this.getDiff(
      repoId,
      targetBranch.headCommitSha || 'HEAD',
      sourceBranch.headCommitSha || 'HEAD',
    );

    // Create PR
    const pr = this.pullRequestRepository.create({
      number: nextNumber,
      title: createDto.title,
      description: createDto.description,
      repositoryId: repoId,
      authorId: userId,
      sourceBranchId: sourceBranch.id,
      targetBranchId: targetBranch.id,
      diff,
      isDraft: createDto.isDraft || false,
    });

    const savedPR = await this.pullRequestRepository.save(pr);

    // Track activity
    await this.activityService.trackActivity(userId, repoId, 'pull_request');

    // Emit WebSocket event
    this.webSocketGateway.emitPullRequestCreated(repoId, savedPR);

    return savedPR;
  }

  async getPullRequests(
    repoId: string,
    status?: PullRequestStatus,
  ): Promise<PullRequest[]> {
    const query = this.pullRequestRepository
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.author', 'author')
      .leftJoinAndSelect('pr.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('pr.targetBranch', 'targetBranch')
      .where('pr.repositoryId = :repoId', { repoId })
      .orderBy('pr.createdAt', 'DESC');

    if (status) {
      query.andWhere('pr.status = :status', { status });
    }

    return query.getMany();
  }

  async getPullRequest(repoId: string, number: number): Promise<PullRequest> {
    const pr = await this.pullRequestRepository.findOne({
      where: { repositoryId: repoId, number },
      relations: ['author', 'sourceBranch', 'targetBranch', 'mergedBy'],
    });

    if (!pr) {
      throw new NotFoundException('Pull request not found');
    }

    return pr;
  }

  async mergePullRequest(
    repoId: string,
    prNumber: number,
    userId: string,
    mergeDto: MergePullRequestDto,
  ): Promise<PullRequest> {
    const pr = await this.getPullRequest(repoId, prNumber);

    if (pr.status !== PullRequestStatus.OPEN) {
      throw new BadRequestException('Pull request is not open');
    }

    const repo = await this.repositoryService.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(repo.ownerId, repo.name);

    // Merge branches using Git service
    await this.gitService.mergeBranches(
      repoPath,
      pr.sourceBranch.name,
      pr.targetBranch.name,
    );

    // Update PR status
    pr.status = PullRequestStatus.MERGED;
    pr.mergedById = userId;
    pr.mergedAt = new Date();

    const savedPR = await this.pullRequestRepository.save(pr);

    // Track activity
    await this.activityService.trackActivity(userId, repoId, 'pull_request_merge');

    // Emit WebSocket event
    this.webSocketGateway.emitPullRequestMerged(repoId, savedPR);

    return savedPR;
  }

  async closePullRequest(
    repoId: string,
    prNumber: number,
  ): Promise<PullRequest> {
    const pr = await this.getPullRequest(repoId, prNumber);

    if (pr.status !== PullRequestStatus.OPEN) {
      throw new BadRequestException('Pull request is not open');
    }

    pr.status = PullRequestStatus.CLOSED;
    return await this.pullRequestRepository.save(pr);
  }
}
