import { IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @IsString()
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
