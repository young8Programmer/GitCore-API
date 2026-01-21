import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Repository } from './repository.entity';

export enum ActivityType {
  COMMIT = 'commit',
  PUSH = 'push',
  PULL_REQUEST = 'pull_request',
  PULL_REQUEST_MERGE = 'pull_request_merge',
  BRANCH_CREATE = 'branch_create',
  BRANCH_DELETE = 'branch_delete',
}

@Entity('activities')
@Index(['userId', 'date'])
@Index(['repositoryId', 'date'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.activities)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  repositoryId: string;

  @ManyToOne(() => Repository, { nullable: true })
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column({ type: 'date' })
  date: Date; // Date of the activity (for contribution graph)

  @Column({ type: 'int', default: 1 })
  count: number; // Number of contributions on this date

  @Column({ type: 'jsonb', nullable: true })
  metadata: object; // Additional data about the activity

  @CreateDateColumn()
  createdAt: Date;
}
