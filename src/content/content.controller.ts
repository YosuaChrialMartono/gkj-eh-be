import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ContentService, PaginatedResult } from "./content.service";
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
} from "./dto/content.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CONTENT_MANAGER_ROLES } from "../users/user-role.enum";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get("public")
  findPublic(@Query() query: ContentQueryDto) {
    return this.contentService.findPublic(query);
  }

  @Get("public/slug/:slug")
  findPublicBySlug(@Param("slug") slug: string) {
    return this.contentService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ContentQueryDto) {
    return this.contentService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.contentService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CONTENT_MANAGER_ROLES)
  @Post()
  create(@Body() dto: CreateContentDto, @Request() req: any) {
    return this.contentService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CONTENT_MANAGER_ROLES)
  @Put(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.contentService.delete(id);
  }
}
