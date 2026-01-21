import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('contributions')
  @UseGuards(JwtAuthGuard)
  async getContributions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityService.getContributions(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('contributions/graph')
  @UseGuards(JwtAuthGuard)
  async getContributionGraph(
    @Request() req,
    @Query('year') year?: number,
  ) {
    return this.activityService.getContributionGraph(req.user.id, year);
  }

  @Get('users/:userId/contributions')
  async getUserContributions(
    @Param('userId') userId: string,
    @Query('year') year?: number,
  ) {
    return this.activityService.getContributionGraph(userId, year);
  }

  @Get('repositories/:repoId')
  async getRepositoryActivity(
    @Param('repoId') repoId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getRepositoryActivity(repoId, limit || 50);
  }
}
