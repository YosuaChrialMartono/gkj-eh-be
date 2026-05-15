import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Report } from "./entities/report.entity";

type Payload = Record<string, unknown>;

function toApi(r: Report): Record<string, unknown> {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    tanggal: r.tanggal,
    jenisKebaktian: r.jenisKebaktian,
    ...r.data,
  };
}

function splitInput(input: Record<string, unknown>): {
  tanggal?: string;
  jenisKebaktian?: string;
  data: Record<string, unknown>;
} {
  const { tanggal, jenisKebaktian, id, createdAt, updatedAt, ...rest } = input;
  return {
    tanggal: tanggal as string | undefined,
    jenisKebaktian: jenisKebaktian as string | undefined,
    data: rest,
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private repo: Repository<Report>,
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const rows = await this.repo.find({
      order: { tanggal: "DESC", createdAt: "DESC" },
    });
    return rows.map(toApi);
  }

  async get(id: string): Promise<Record<string, unknown>> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Report not found");
    return toApi(row);
  }

  async create(body: Payload): Promise<Record<string, unknown>> {
    const { tanggal, jenisKebaktian, data } = splitInput(body);
    const row = this.repo.create({
      tanggal: tanggal!,
      jenisKebaktian: jenisKebaktian!,
      data,
    });
    const saved = await this.repo.save(row);
    return toApi(saved);
  }

  async update(
    id: string,
    body: Payload,
  ): Promise<Record<string, unknown>> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("Report not found");

    const incoming = splitInput(body);
    if (incoming.tanggal !== undefined) existing.tanggal = incoming.tanggal;
    if (incoming.jenisKebaktian !== undefined)
      existing.jenisKebaktian = incoming.jenisKebaktian;
    // Merge JSON: new keys override old ones
    existing.data = { ...existing.data, ...incoming.data };

    const saved = await this.repo.save(existing);
    return toApi(saved);
  }

  async delete(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException("Report not found");
  }
}
