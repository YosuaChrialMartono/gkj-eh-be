import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsISO8601, IsOptional, IsString } from "class-validator";
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

  // Full ISO 8601 timestamp (the FE sends new Date(...).toISOString()).
  // Validating the format guarantees `new Date(publishedAt)` is never Invalid.
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}

export class UpdateContentDto extends PartialType(CreateContentDto) {}

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
