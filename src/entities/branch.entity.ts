import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { Commit } from './commit.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.branches)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column({ nullable: true })
  headCommitSha: string; // Latest commit SHA on this branch

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isProtected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.branch)
  commits: Commit[];
}
