import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';

export enum PullRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
}

@Entity('pull_requests')
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: number; // PR number

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PullRequestStatus,
    default: PullRequestStatus.OPEN,
  })
  status: PullRequestStatus;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.pullRequests)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column()
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  sourceBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'sourceBranchId' })
  sourceBranch: Branch;

  @Column()
  targetBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'targetBranchId' })
  targetBranch: Branch;

  @Column({ nullable: true })
  mergedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mergedById' })
  mergedBy: User;

  @Column({ nullable: true })
  mergedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  diff: object; // Changes between branches

  @Column({ type: 'jsonb', nullable: true })
  reviewers: string[]; // User IDs

  @Column({ default: false })
  isDraft: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
