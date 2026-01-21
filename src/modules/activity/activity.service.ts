import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType } from '../../entities/activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async trackActivity(
    userId: string,
    repositoryId: string | null,
    type: ActivityType,
    metadata?: object,
  ): Promise<Activity> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing activity for today
    let activity = await this.activityRepository.findOne({
      where: {
        userId,
        repositoryId: repositoryId || undefined,
        type,
        date: today,
      },
    });

    if (activity) {
      // Increment count
      activity.count += 1;
      if (metadata) {
        activity.metadata = { ...activity.metadata, ...metadata };
      }
    } else {
      // Create new activity
      activity = this.activityRepository.create({
        userId,
        repositoryId,
        type,
        date: today,
        count: 1,
        metadata,
      });
    }

    return await this.activityRepository.save(activity);
  }

  async getContributions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Activity[]> {
    const query = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .orderBy('activity.date', 'ASC');

    if (startDate) {
      query.andWhere('activity.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('activity.date <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async getContributionGraph(userId: string, year?: number): Promise<any> {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    const activities = await this.getContributions(userId, startDate, endDate);

    // Build contribution graph (GitHub-style)
    const graph: { [date: string]: number } = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      graph[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in actual contributions
    for (const activity of activities) {
      const dateKey = activity.date.toISOString().split('T')[0];
      graph[dateKey] = (graph[dateKey] || 0) + activity.count;
    }

    return {
      year: targetYear,
      total: activities.reduce((sum, a) => sum + a.count, 0),
      contributions: graph,
    };
  }

  async getRepositoryActivity(
    repositoryId: string,
    limit: number = 50,
  ): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: { repositoryId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
