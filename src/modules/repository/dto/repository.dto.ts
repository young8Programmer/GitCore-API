import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RepositoryVisibility } from '../../../entities/repository.entity';

export class CreateRepositoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RepositoryVisibility)
  visibility: RepositoryVisibility;
}

export class UpdateRepositoryDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RepositoryVisibility)
  visibility?: RepositoryVisibility;

  @IsOptional()
  @IsString()
  defaultBranch?: string;
}

export class FileDto {
  @IsString()
  path: string;

  @IsString()
  content: string;
}

export class CommitDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files: FileDto[];

  @IsOptional()
  @IsString()
  branch?: string;
}
