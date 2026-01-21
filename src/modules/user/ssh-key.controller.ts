import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SSHKeyService } from './ssh-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSSHKeyDto } from './dto/ssh-key.dto';

@Controller('ssh-keys')
@UseGuards(JwtAuthGuard)
export class SSHKeyController {
  constructor(private sshKeyService: SSHKeyService) {}

  @Post()
  async create(@Request() req, @Body() createDto: CreateSSHKeyDto) {
    return this.sshKeyService.create(req.user.id, createDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.sshKeyService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.sshKeyService.findOne(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.sshKeyService.delete(id, req.user.id);
    return { message: 'SSH key deleted successfully' };
  }
}
