import { IsISO8601, IsOptional, IsString } from "class-validator";

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  type: string;

  @IsString()
  status: string;

  @IsString()
  body: string;

  @IsString()
  bodyHtml: string;

  @IsOptional()
  @IsString()
  featuredImageUrl?: string;

  // Full ISO 8601 timestamp (the FE sends new Date(...).toISOString()).
  // Validating the format guarantees `new Date(publishedAt)` is never Invalid.
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}

export class UpdateContentDto extends CreateContentDto {}

export class ContentQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
