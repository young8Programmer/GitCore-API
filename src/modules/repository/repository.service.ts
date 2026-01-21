import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repository as RepoEntity } from '../../entities/repository.entity';
import { GitService } from '../git/git.service';
import { StorageService } from '../storage/storage.service';
import { ActivityService } from '../activity/activity.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { CreateRepositoryDto, UpdateRepositoryDto } from './dto/repository.dto';
import { RepositoryVisibility } from '../../entities/repository.entity';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectRepository(RepoEntity)
    private repositoryRepository: Repository<RepoEntity>,
    private gitService: GitService,
    private storageService: StorageService,
    private activityService: ActivityService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  async create(
    ownerId: string,
    createDto: CreateRepositoryDto,
  ): Promise<RepoEntity> {
    // Check if repository name already exists for this user
    const fullName = `${ownerId}/${createDto.name}`;
    const existing = await this.repositoryRepository.findOne({
      where: { fullName },
    });

    if (existing) {
      throw new ForbiddenException('Repository with this name already exists');
    }

    const repo = this.repositoryRepository.create({
      ...createDto,
      ownerId,
      fullName,
      defaultBranch: 'main',
    });

    const savedRepo = await this.repositoryRepository.save(repo);

    // Initialize Git repository
    const repoPath = this.gitService.getRepositoryPath(ownerId, createDto.name);
    await this.gitService.initRepository(repoPath);

    // Emit WebSocket event
    this.webSocketGateway.emitRepositoryCreated(savedRepo);

    return savedRepo;
  }

  async findAll(userId?: string): Promise<RepoEntity[]> {
    const query = this.repositoryRepository
      .createQueryBuilder('repo')
      .leftJoinAndSelect('repo.owner', 'owner')
      .where('repo.visibility = :visibility', {
        visibility: RepositoryVisibility.PUBLIC,
      });

    if (userId) {
      query.orWhere('repo.ownerId = :userId', { userId });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<RepoEntity> {
    const repo = await this.repositoryRepository.findOne({
      where: { id },
      relations: ['owner', 'branches', 'collaborators'],
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return repo;
  }

  async findByFullName(fullName: string): Promise<RepoEntity> {
    const repo = await this.repositoryRepository.findOne({
      where: { fullName },
      relations: ['owner', 'branches'],
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return repo;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateRepositoryDto,
  ): Promise<RepoEntity> {
    const repo = await this.findById(id);

    if (repo.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update repository');
    }

    Object.assign(repo, updateDto);
    return await this.repositoryRepository.save(repo);
  }

  async delete(id: string, userId: string): Promise<void> {
    const repo = await this.findById(id);

    if (repo.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete repository');
    }

    await this.repositoryRepository.remove(repo);
  }

  async getFileTree(
    repoId: string,
    branch: string = 'main',
  ): Promise<object> {
    const repo = await this.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(
      repo.ownerId,
      repo.name,
    );

    return await this.gitService.getFileTree(repoPath, branch);
  }

  async commit(
    repoId: string,
    userId: string,
    message: string,
    files: { path: string; content: string }[],
    branch: string = 'main',
  ): Promise<string> {
    const repo = await this.findById(repoId);
    const repoPath = this.gitService.getRepositoryPath(repo.ownerId, repo.name);

    // Save files to storage
    for (const file of files) {
      await this.storageService.saveFile(file.path, file.content, repoId);
    }

    // Create commit using Git service
    const commitSha = await this.gitService.createCommit(
      repoPath,
      message,
      {
        name: userId,
        email: `${userId}@gitcore.local`,
      },
      files,
    );

    // Track activity
    await this.activityService.trackActivity(userId, repoId, 'commit');

    // Emit WebSocket event
    this.webSocketGateway.emitCommit(repoId, {
      sha: commitSha,
      message,
      author: userId,
    });

    return commitSha;
  }

  async star(repoId: string, userId: string): Promise<RepoEntity> {
    const repo = await this.findById(repoId);
    repo.starsCount += 1;
    return await this.repositoryRepository.save(repo);
  }

  async fork(
    repoId: string,
    userId: string,
    newName?: string,
  ): Promise<RepoEntity> {
    const originalRepo = await this.findById(repoId);
    const forkName = newName || originalRepo.name;

    const fork = this.repositoryRepository.create({
      name: forkName,
      description: originalRepo.description,
      visibility: originalRepo.visibility,
      ownerId: userId,
      fullName: `${userId}/${forkName}`,
      isFork: true,
      parentRepositoryId: originalRepo.id,
      defaultBranch: originalRepo.defaultBranch,
    });

    const savedFork = await this.repositoryRepository.save(fork);
    originalRepo.forksCount += 1;
    await this.repositoryRepository.save(originalRepo);

    return savedFork;
  }
}
