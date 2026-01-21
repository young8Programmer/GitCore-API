import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { CollaboratorService } from '../user/collaborator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateRepositoryDto,
  UpdateRepositoryDto,
  CommitDto,
} from './dto/repository.dto';
import {
  AddCollaboratorDto,
  UpdateCollaboratorDto,
} from '../user/dto/collaborator.dto';

@Controller('repositories')
export class RepositoryController {
  constructor(
    private repositoryService: RepositoryService,
    private collaboratorService: CollaboratorService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createDto: CreateRepositoryDto) {
    return this.repositoryService.create(req.user.id, createDto);
  }

  @Get()
  async findAll(@Request() req, @Query('user') userId?: string) {
    return this.repositoryService.findAll(userId || req.user?.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.repositoryService.findById(id);
  }

  @Get(':owner/:name')
  async findByFullName(
    @Param('owner') owner: string,
    @Param('name') name: string,
  ) {
    return this.repositoryService.findByFullName(`${owner}/${name}`);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateRepositoryDto,
  ) {
    return this.repositoryService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req, @Param('id') id: string) {
    await this.repositoryService.delete(id, req.user.id);
    return { message: 'Repository deleted successfully' };
  }

  @Get(':id/tree')
  async getFileTree(
    @Param('id') id: string,
    @Query('branch') branch?: string,
  ) {
    return this.repositoryService.getFileTree(id, branch || 'main');
  }

  @Post(':id/commits')
  @UseGuards(JwtAuthGuard)
  async commit(
    @Request() req,
    @Param('id') id: string,
    @Body() commitDto: CommitDto,
  ) {
    const sha = await this.repositoryService.commit(
      id,
      req.user.id,
      commitDto.message,
      commitDto.files,
      commitDto.branch || 'main',
    );
    return { sha, message: 'Commit created successfully' };
  }

  @Post(':id/star')
  @UseGuards(JwtAuthGuard)
  async star(@Request() req, @Param('id') id: string) {
    return this.repositoryService.star(id, req.user.id);
  }

  @Post(':id/fork')
  @UseGuards(JwtAuthGuard)
  async fork(
    @Request() req,
    @Param('id') id: string,
    @Body('name') newName?: string,
  ) {
    return this.repositoryService.fork(id, req.user.id, newName);
  }

  // Collaborators
  @Post(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  async addCollaborator(
    @Request() req,
    @Param('id') id: string,
    @Body() addDto: AddCollaboratorDto,
  ) {
    return this.collaboratorService.addCollaborator(id, req.user.id, addDto);
  }

  @Get(':id/collaborators')
  async getCollaborators(@Param('id') id: string) {
    return this.collaboratorService.getCollaborators(id);
  }

  @Put(':id/collaborators/:userId')
  @UseGuards(JwtAuthGuard)
  async updateCollaborator(
    @Request() req,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateCollaboratorDto,
  ) {
    return this.collaboratorService.updateCollaborator(
      id,
      userId,
      req.user.id,
      updateDto,
    );
  }

  @Delete(':id/collaborators/:userId')
  @UseGuards(JwtAuthGuard)
  async removeCollaborator(
    @Request() req,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.collaboratorService.removeCollaborator(id, userId, req.user.id);
    return { message: 'Collaborator removed successfully' };
  }
}
