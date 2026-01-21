import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commit } from '../../entities/commit.entity';
import { Branch } from '../../entities/branch.entity';
import { PullRequest } from '../../entities/pull-request.entity';
import { VersionControlService } from './version-control.service';
import { VersionControlController } from './version-control.controller';
import { GitModule } from '../git/git.module';
import { RepositoryModule } from '../repository/repository.module';
import { ActivityModule } from '../activity/activity.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commit, Branch, PullRequest]),
    GitModule,
    RepositoryModule,
    ActivityModule,
    WebSocketModule,
  ],
  controllers: [VersionControlController],
  providers: [VersionControlService],
  exports: [VersionControlService],
})
export class VersionControlModule {}
