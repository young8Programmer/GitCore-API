import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { SSHKey } from '../../entities/ssh-key.entity';
import { RepositoryCollaborator } from '../../entities/repository-collaborator.entity';
import { Repository as RepoEntity } from '../../entities/repository.entity';
import { UserService } from './user.service';
import { SSHKeyService } from './ssh-key.service';
import { CollaboratorService } from './collaborator.service';
import { UserController } from './user.controller';
import { SSHKeyController } from './ssh-key.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SSHKey, RepositoryCollaborator, RepoEntity]),
  ],
  controllers: [UserController, SSHKeyController],
  providers: [UserService, SSHKeyService, CollaboratorService],
  exports: [UserService, SSHKeyService, CollaboratorService],
})
export class UserModule {}
