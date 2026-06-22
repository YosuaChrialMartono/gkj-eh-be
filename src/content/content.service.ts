import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Content } from "./entities/content.entity";
import { User } from "../users/entities/user.entity";
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
} from "./dto/content.dto";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MAX_PAGE_SIZE = 100;

// Clamp paging so a hostile/garbled ?limit=999999 or ?page=-1 can't exhaust
// memory or the DB. NaN falls back to the defaults.
function parsePaging(query: ContentQueryDto): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit || "10", 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}

// Author projection — NEVER includes `password`. Public callers get the
// minimal shape; authenticated callers get the richer (still password-free) one.
export interface PublicAuthor {
  name: string;
  avatar: string | null;
}
export interface PrivateAuthor extends PublicAuthor {
  email: string;
  role: string;
}

export interface ContentResponse extends Omit<Content, "author"> {
  author: PublicAuthor | PrivateAuthor | null;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  private toPublicAuthor(user?: User | null): PublicAuthor | null {
    if (!user) return null;
    return { name: user.name, avatar: user.avatar ?? null };
  }

  private toPrivateAuthor(user?: User | null): PrivateAuthor | null {
    if (!user) return null;
    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
      role: user.role,
    };
  }

  private toResponse(
    content: Content,
    visibility: "public" | "private",
  ): ContentResponse {
    const { author, ...rest } = content;
    return {
      ...rest,
      author:
        visibility === "private"
          ? this.toPrivateAuthor(author)
          : this.toPublicAuthor(author),
    };
  }

  async findAll(
    query: ContentQueryDto,
  ): Promise<PaginatedResult<ContentResponse>> {
    const { page, limit, skip } = parsePaging(query);

    const qb = this.contentRepository
      .createQueryBuilder("content")
      .leftJoinAndSelect("content.author", "author");

    if (query.type) {
      qb.andWhere("content.type = :type", { type: query.type });
    }

    if (query.status) {
      qb.andWhere("content.status = :status", { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        "(content.title ILIKE :search OR content.body ILIKE :search)",
        {
          search: `%${query.search}%`,
        },
      );
    }

    qb.orderBy("content.createdAt", "DESC");

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((c) => this.toResponse(c, "private")),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(
    query: ContentQueryDto,
  ): Promise<PaginatedResult<ContentResponse>> {
    const { page, limit, skip } = parsePaging(query);

    const qb = this.contentRepository
      .createQueryBuilder("content")
      .leftJoinAndSelect("content.author", "author")
      .where("content.status = :status", { status: "published" });

    if (query.type) {
      qb.andWhere("content.type = :type", { type: query.type });
    }

    if (query.search) {
      qb.andWhere(
        "(content.title ILIKE :search OR content.body ILIKE :search)",
        {
          search: `%${query.search}%`,
        },
      );
    }

    qb.orderBy("content.publishedAt", "DESC");

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((c) => this.toResponse(c, "public")),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Raw entity loader for internal use (update/delete need the persistable
  // entity, not the password-stripped projection).
  private async findEntityById(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ["author"],
    });
    if (!content) {
      throw new NotFoundException("Content not found");
    }
    return content;
  }

  async findById(id: string): Promise<ContentResponse> {
    return this.toResponse(await this.findEntityById(id), "private");
  }

  async findBySlug(slug: string): Promise<ContentResponse> {
    const content = await this.contentRepository.findOne({
      where: { slug, status: "published" },
      relations: ["author"],
    });
    if (!content) {
      throw new NotFoundException("Content not found");
    }
    return this.toResponse(content, "public");
  }

  async create(
    dto: CreateContentDto,
    authorId: string,
  ): Promise<ContentResponse> {
    const publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    const content = this.contentRepository.create({
      ...dto,
      authorId,
      publishedAt,
    });
    const saved = await this.contentRepository.save(content);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateContentDto): Promise<ContentResponse> {
    const content = await this.findEntityById(id);
    Object.assign(content, dto);
    if (dto.publishedAt) {
      content.publishedAt = new Date(dto.publishedAt);
    }
    const saved = await this.contentRepository.save(content);
    return this.findById(saved.id);
  }

  async delete(id: string): Promise<void> {
    const content = await this.findEntityById(id);
    await this.contentRepository.remove(content);
  }
}
