import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Repository } from './repository.entity';
import { User } from './user.entity';

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

@Entity('repository_collaborators')
@Unique(['repositoryId', 'userId'])
export class RepositoryCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.collaborators)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.collaborations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: Permission,
    default: Permission.READ,
  })
  permission: Permission;

  @CreateDateColumn()
  createdAt: Date;
}
