import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { Commit } from './commit.entity';

@Entity('file_trees')
export class FileTree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @Column({ nullable: true })
  commitId: string;

  @ManyToOne(() => Commit, { nullable: true })
  @JoinColumn({ name: 'commitId' })
  commit: Commit;

  @Column({ nullable: true })
  branchName: string;

  @Column({ type: 'jsonb' })
  tree: object; // Full file tree structure

  @CreateDateColumn()
  createdAt: Date;
}
