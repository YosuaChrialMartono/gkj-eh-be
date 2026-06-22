import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CONTENT_MANAGER_ROLES } from "../users/user-role.enum";
import { ReportsService } from "./reports.service";

type Payload = Record<string, unknown>;

function isYmd(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.svc.get(id);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Post()
  create(@Body() body: Payload) {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Body must be an object");
    }
    if (!isYmd(body.tanggal)) {
      throw new BadRequestException("tanggal must be YYYY-MM-DD");
    }
    if (typeof body.jenisKebaktian !== "string" || !body.jenisKebaktian) {
      throw new BadRequestException("jenisKebaktian is required");
    }
    return this.svc.create(body);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Put(":id")
  update(@Param("id") id: string, @Body() body: Payload) {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Body must be an object");
    }
    if (body.tanggal !== undefined && !isYmd(body.tanggal)) {
      throw new BadRequestException("tanggal must be YYYY-MM-DD");
    }
    if (
      body.jenisKebaktian !== undefined &&
      typeof body.jenisKebaktian !== "string"
    ) {
      throw new BadRequestException("jenisKebaktian must be a string");
    }
    return this.svc.update(id, body);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string) {
    await this.svc.delete(id);
  }
}
