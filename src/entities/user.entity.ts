import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Repository } from './repository.entity';
import { SSHKey } from './ssh-key.entity';
import { Activity } from './activity.entity';
import { RepositoryCollaborator } from './repository-collaborator.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // hashed

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Repository, (repo) => repo.owner)
  repositories: Repository[];

  @OneToMany(() => SSHKey, (key) => key.user)
  sshKeys: SSHKey[];

  @OneToMany(() => Activity, (activity) => activity.user)
  activities: Activity[];

  @OneToMany(() => RepositoryCollaborator, (collab) => collab.user)
  collaborations: RepositoryCollaborator[];
}
