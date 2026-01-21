import { IsString, IsEnum } from 'class-validator';
import { Permission } from '../../../entities/repository-collaborator.entity';

export class AddCollaboratorDto {
  @IsString()
  userId: string;

  @IsEnum(Permission)
  permission: Permission;
}

export class UpdateCollaboratorDto {
  @IsEnum(Permission)
  permission: Permission;
}
