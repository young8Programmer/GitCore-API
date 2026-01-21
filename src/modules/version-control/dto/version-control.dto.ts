import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FileDto {
  @IsString()
  path: string;

  @IsString()
  content: string;
}

export class CreateCommitDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files: FileDto[];

  @IsString()
  branch: string;
}

export class CreateBranchDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  fromBranch?: string;
}

export class CreatePullRequestDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  sourceBranch: string;

  @IsString()
  targetBranch: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class MergePullRequestDto {
  @IsOptional()
  @IsString()
  mergeMessage?: string;
}
