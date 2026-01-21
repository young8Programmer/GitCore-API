import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const { password, ...user } = await this.userService.findById(req.user.id);
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const { password, ...user } = await this.userService.findById(id);
    return user;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateDto: UpdateUserDto) {
    const { password, ...user } = await this.userService.update(
      req.user.id,
      updateDto,
    );
    return user;
  }
}
