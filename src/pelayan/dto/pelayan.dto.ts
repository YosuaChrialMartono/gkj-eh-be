import { IsOptional, IsString, IsInt, Matches, IsUUID } from "class-validator";

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

export class ServicesQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: "month must be in YYYY-MM format" })
  month?: string;
}

export class AssignmentsQueryDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}

export class UpsertPelayanAssignmentDto {
  @IsString()
  serviceId: string;

  @IsString()
  roleId: string;

  @IsString()
  pelayanName: string;
}
