import { IsEnum, IsOptional, IsString } from "class-validator";
import { ContentStatus, ContentType } from "../content.enums";

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsEnum(ContentStatus)
  status: ContentStatus;

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
  @IsEnum(ContentType)
  type?: ContentType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
