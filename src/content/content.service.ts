import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Content } from "./entities/content.entity";
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

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async findAll(query: ContentQueryDto): Promise<PaginatedResult<Content>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const qb = this.contentRepository.createQueryBuilder("content");

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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(query: ContentQueryDto): Promise<PaginatedResult<Content>> {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const qb = this.contentRepository
      .createQueryBuilder("content")
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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ["author"],
    });
    if (!content) {
      throw new NotFoundException("Content not found");
    }
    return content;
  }

  async findBySlug(slug: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { slug, status: "published" },
      relations: ["author"],
    });
    if (!content) {
      throw new NotFoundException("Content not found");
    }
    return content;
  }

  async create(dto: CreateContentDto, authorId: string): Promise<Content> {
    const publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    const content = this.contentRepository.create({
      ...dto,
      authorId,
      publishedAt,
    });
    return this.contentRepository.save(content);
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    const content = await this.findById(id);
    Object.assign(content, dto);
    if (dto.publishedAt) {
      content.publishedAt = new Date(dto.publishedAt);
    }
    return this.contentRepository.save(content);
  }

  async delete(id: string): Promise<void> {
    const content = await this.findById(id);
    await this.contentRepository.remove(content);
  }
}
