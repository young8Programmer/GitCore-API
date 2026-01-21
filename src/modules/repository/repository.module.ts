import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../../entities/repository.entity';
import { RepositoryService } from './repository.service';
import { RepositoryController } from './repository.controller';
import { GitModule } from '../git/git.module';
import { StorageModule } from '../storage/storage.module';
import { ActivityModule } from '../activity/activity.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repository]),
    GitModule,
    StorageModule,
    ActivityModule,
    WebSocketModule,
    UserModule,
  ],
  controllers: [RepositoryController],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}
