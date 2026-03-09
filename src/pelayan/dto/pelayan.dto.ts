import { IsOptional, IsString, IsInt } from 'class-validator';

export class CreatePelayanRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdatePelayanRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreatePelayanPersonDto {
  @IsString()
  name: string;
}

export class CreatePelayanServiceDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  isExtra?: boolean;
}

export class UpdatePelayanServiceDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  isExtra?: boolean;
}

export class UpsertPelayanAssignmentDto {
  @IsString()
  serviceId: string;

  @IsString()
  roleId: string;

  @IsString()
  pelayanName: string;
}
