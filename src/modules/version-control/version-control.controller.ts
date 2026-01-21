import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VersionControlService } from './version-control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateCommitDto,
  CreateBranchDto,
  CreatePullRequestDto,
  MergePullRequestDto,
} from './dto/version-control.dto';
import { PullRequestStatus } from '../../entities/pull-request.entity';

@Controller('repositories/:repoId')
export class VersionControlController {
  constructor(private versionControlService: VersionControlService) {}

  // ========== COMMITS ==========

  @Post('commits')
  @UseGuards(JwtAuthGuard)
  async createCommit(
    @Request() req,
    @Param('repoId') repoId: string,
    @Body() createDto: CreateCommitDto,
  ) {
    return this.versionControlService.createCommit(
      repoId,
      req.user.id,
      createDto,
    );
  }

  @Get('commits')
  async getCommits(
    @Param('repoId') repoId: string,
    @Query('branch') branch?: string,
    @Query('limit') limit?: number,
  ) {
    return this.versionControlService.getCommits(
      repoId,
      branch,
      limit || 50,
    );
  }

  @Get('commits/:sha')
  async getCommit(
    @Param('repoId') repoId: string,
    @Param('sha') sha: string,
  ) {
    return this.versionControlService.getCommit(repoId, sha);
  }

  // ========== BRANCHES ==========

  @Post('branches')
  @UseGuards(JwtAuthGuard)
  async createBranch(
    @Request() req,
    @Param('repoId') repoId: string,
    @Body() createDto: CreateBranchDto,
  ) {
    return this.versionControlService.createBranch(
      repoId,
      req.user.id,
      createDto,
    );
  }

  @Get('branches')
  async getBranches(@Param('repoId') repoId: string) {
    return this.versionControlService.getBranches(repoId);
  }

  @Get('branches/:name')
  async getBranch(
    @Param('repoId') repoId: string,
    @Param('name') name: string,
  ) {
    return this.versionControlService.getBranch(repoId, name);
  }

  @Delete('branches/:name')
  @UseGuards(JwtAuthGuard)
  async deleteBranch(
    @Param('repoId') repoId: string,
    @Param('name') name: string,
  ) {
    await this.versionControlService.deleteBranch(repoId, name);
    return { message: 'Branch deleted successfully' };
  }

  // ========== DIFFS ==========

  @Get('diff')
  async getDiff(
    @Param('repoId') repoId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.versionControlService.getDiff(repoId, from, to);
  }

  // ========== PULL REQUESTS ==========

  @Post('pull-requests')
  @UseGuards(JwtAuthGuard)
  async createPullRequest(
    @Request() req,
    @Param('repoId') repoId: string,
    @Body() createDto: CreatePullRequestDto,
  ) {
    return this.versionControlService.createPullRequest(
      repoId,
      req.user.id,
      createDto,
    );
  }

  @Get('pull-requests')
  async getPullRequests(
    @Param('repoId') repoId: string,
    @Query('status') status?: PullRequestStatus,
  ) {
    return this.versionControlService.getPullRequests(repoId, status);
  }

  @Get('pull-requests/:number')
  async getPullRequest(
    @Param('repoId') repoId: string,
    @Param('number') number: number,
  ) {
    return this.versionControlService.getPullRequest(repoId, number);
  }

  @Post('pull-requests/:number/merge')
  @UseGuards(JwtAuthGuard)
  async mergePullRequest(
    @Request() req,
    @Param('repoId') repoId: string,
    @Param('number') number: number,
    @Body() mergeDto: MergePullRequestDto,
  ) {
    return this.versionControlService.mergePullRequest(
      repoId,
      number,
      req.user.id,
      mergeDto,
    );
  }

  @Put('pull-requests/:number/close')
  @UseGuards(JwtAuthGuard)
  async closePullRequest(
    @Param('repoId') repoId: string,
    @Param('number') number: number,
  ) {
    return this.versionControlService.closePullRequest(repoId, number);
  }
}
