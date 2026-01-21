import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryCollaborator, Permission } from '../../entities/repository-collaborator.entity';
import { Repository as RepoEntity } from '../../entities/repository.entity';
import { AddCollaboratorDto, UpdateCollaboratorDto } from './dto/collaborator.dto';

@Injectable()
export class CollaboratorService {
  constructor(
    @InjectRepository(RepositoryCollaborator)
    private collaboratorRepository: Repository<RepositoryCollaborator>,
    @InjectRepository(RepoEntity)
    private repositoryRepository: Repository<RepoEntity>,
  ) {}

  async addCollaborator(
    repoId: string,
    ownerId: string,
    addDto: AddCollaboratorDto,
  ): Promise<RepositoryCollaborator> {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    if (repo.ownerId !== ownerId) {
      throw new ForbiddenException('Only owner can add collaborators');
    }

    // Check if already a collaborator
    const existing = await this.collaboratorRepository.findOne({
      where: { repositoryId: repoId, userId: addDto.userId },
    });

    if (existing) {
      throw new ForbiddenException('User is already a collaborator');
    }

    const collaborator = this.collaboratorRepository.create({
      repositoryId: repoId,
      userId: addDto.userId,
      permission: addDto.permission || Permission.READ,
    });

    return await this.collaboratorRepository.save(collaborator);
  }

  async getCollaborators(repoId: string): Promise<RepositoryCollaborator[]> {
    return await this.collaboratorRepository.find({
      where: { repositoryId: repoId },
      relations: ['user'],
    });
  }

  async updateCollaborator(
    repoId: string,
    userId: string,
    ownerId: string,
    updateDto: UpdateCollaboratorDto,
  ): Promise<RepositoryCollaborator> {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    if (repo.ownerId !== ownerId) {
      throw new ForbiddenException('Only owner can update collaborators');
    }

    const collaborator = await this.collaboratorRepository.findOne({
      where: { repositoryId: repoId, userId },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    collaborator.permission = updateDto.permission;
    return await this.collaboratorRepository.save(collaborator);
  }

  async removeCollaborator(
    repoId: string,
    userId: string,
    ownerId: string,
  ): Promise<void> {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    if (repo.ownerId !== ownerId) {
      throw new ForbiddenException('Only owner can remove collaborators');
    }

    const collaborator = await this.collaboratorRepository.findOne({
      where: { repositoryId: repoId, userId },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.collaboratorRepository.remove(collaborator);
  }

  async checkPermission(
    repoId: string,
    userId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repoId },
    });

    if (!repo) {
      return false;
    }

    // Owner has all permissions
    if (repo.ownerId === userId) {
      return true;
    }

    // Check collaborator permissions
    const collaborator = await this.collaboratorRepository.findOne({
      where: { repositoryId: repoId, userId },
    });

    if (!collaborator) {
      // Check if repository is public (read only)
      if (requiredPermission === Permission.READ && repo.visibility === 'public') {
        return true;
      }
      return false;
    }

    // Permission hierarchy: READ < WRITE < ADMIN
    const permissionLevels = {
      [Permission.READ]: 1,
      [Permission.WRITE]: 2,
      [Permission.ADMIN]: 3,
    };

    return (
      permissionLevels[collaborator.permission] >=
      permissionLevels[requiredPermission]
    );
  }
}
