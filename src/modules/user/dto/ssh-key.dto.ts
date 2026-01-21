import { IsString, MinLength } from 'class-validator';

export class CreateSSHKeyDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(10)
  publicKey: string;
}
