import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';
import { RepositoryCollaborator } from './repository-collaborator.entity';

export enum RepositoryVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('repositories')
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: RepositoryVisibility,
    default: RepositoryVisibility.PUBLIC,
  })
  visibility: RepositoryVisibility;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: false })
  isFork: boolean;

  @Column({ nullable: true })
  parentRepositoryId: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.repositories)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ unique: true })
  fullName: string; // owner/name format

  @Column({ nullable: true })
  defaultBranch: string;

  @Column({ default: 0 })
  starsCount: number;

  @Column({ default: 0 })
  forksCount: number;

  @Column({ default: 0 })
  watchersCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Branch, (branch) => branch.repository)
  branches: Branch[];

  @OneToMany(() => Commit, (commit) => commit.repository)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repository)
  pullRequests: PullRequest[];

  @OneToMany(() => RepositoryCollaborator, (collab) => collab.repository)
  collaborators: RepositoryCollaborator[];
}
