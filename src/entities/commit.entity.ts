import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';

@Entity('commits')
export class Commit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sha: string; // SHA-1 hash

  @Column()
  message: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.commits)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.commits)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  parentSha: string; // Previous commit SHA

  @Column({ type: 'jsonb', nullable: true })
  tree: object; // File tree structure

  @Column({ type: 'jsonb', nullable: true })
  changes: object; // Files changed in this commit

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  committedAt: Date; // When commit was made (can be different from createdAt)
}
