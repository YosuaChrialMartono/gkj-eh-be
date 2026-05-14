# Developer Guide

## How Auth Works

### Flow
1. `POST /auth/login` or `/register` → returns `{ user, accessToken, refreshToken }`
2. Client stores tokens (access in memory, refresh in httpOnly cookie via BFF)
3. Protected requests send `Authorization: Bearer <accessToken>`
4. `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`) → `JwtStrategy` (`src/auth/strategies/jwt.strategy.ts`) verifies the token and attaches the user to `request.user`
5. `POST /auth/refresh` (with `JwtAuthGuard`) exchanges a valid token for a fresh pair

> Note: no global `/api` prefix; routes are served directly. Frontend (`gkj-eh-web`) sets `API_URL=http://localhost:8080` and hits `/auth/...`, `/content/...` verbatim.

### Token Types
Signed in `src/auth/auth.service.ts` (`generateTokens`):

| Token | TTL (default) | Payload |
|-------|---------------|---------|
| access | 15 min (`jwt.accessTtl`) | `sub`, `email` |
| refresh | 30 days (`jwt.refreshTtl`) | `sub`, `email` |

Both signed with the same `jwt.secret` from `config.yaml`. (Note: there's no separate refresh-token signing key or rotation list — adding one is a known follow-up.)

### Key Files
- `src/auth/auth.service.ts` — register, login, refresh, logout, token signing
- `src/auth/auth.controller.ts` — HTTP routes
- `src/auth/strategies/jwt.strategy.ts` — Passport JWT verification
- `src/auth/guards/jwt-auth.guard.ts` — guard alias for `AuthGuard('jwt')`

---

## Creating a New CRUD

Example: an "Announcements" feature.

### 1. Define the entity

`src/announcements/entities/announcement.entity.ts`:

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("announcements")
export class Announcement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  body?: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

`synchronize: true` in `app.module.ts` will auto-create the table in dev. For prod, switch to migrations.

### 2. DTOs with validation

`src/announcements/dto/announcement.dto.ts`:

```ts
import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class UpdateAnnouncementDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
}
```

The global `ValidationPipe` (set in `main.ts`) strips unknown fields and coerces types.

### 3. Service

`src/announcements/announcements.service.ts`:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Announcement } from "./entities/announcement.entity";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./dto/announcement.dto";

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private repo: Repository<Announcement>,
  ) {}

  list() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async get(id: string) {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException();
    return found;
  }

  create(dto: CreateAnnouncementDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.get(id);
    await this.repo.update(id, dto);
    return this.get(id);
  }

  async delete(id: string) {
    await this.get(id);
    await this.repo.delete(id);
  }
}
```

### 4. Controller

`src/announcements/announcements.controller.ts`:

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AnnouncementsService } from "./announcements.service";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./dto/announcement.dto";

@Controller("announcements")
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private svc: AnnouncementsService) {}

  @Get() list() { return this.svc.list(); }
  @Get(":id") get(@Param("id") id: string) { return this.svc.get(id); }
  @Post() create(@Body() dto: CreateAnnouncementDto) { return this.svc.create(dto); }
  @Put(":id") update(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.svc.update(id, dto);
  }
  @Delete(":id") delete(@Param("id") id: string) { return this.svc.delete(id); }
}
```

Remove `@UseGuards(JwtAuthGuard)` (or carve out specific methods) for public access.

### 5. Module

`src/announcements/announcements.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Announcement } from "./entities/announcement.entity";
import { AnnouncementsService } from "./announcements.service";
import { AnnouncementsController } from "./announcements.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Announcement])],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
```

### 6. Wire into `AppModule`

In `src/app.module.ts`:

- Import `Announcement` and add it to the `entities: [...]` array
- Import `AnnouncementsModule` and add it to `imports: [...]`

Restart `npm run start:dev`; `synchronize: true` creates the table on boot.

---

## Frontend Integration

### What the Frontend Does

1. **Login/Register** → `POST /auth/login` or `/auth/register`
2. **Store tokens**:
   - `accessToken` in memory (or component state)
   - `refreshToken` in an httpOnly cookie via the Next.js BFF
3. **Protected requests** send `Authorization: Bearer <accessToken>`
4. **Token refresh** on 401:
   ```http
   POST /auth/refresh
   Authorization: Bearer <still-valid-refresh-or-access-token>
   ```
   Note: `auth.controller.ts` currently guards `/refresh` with `JwtAuthGuard`, so the client must send a valid (non-expired) token. Real refresh-token rotation is not implemented yet.

### Public vs Protected

| Route | Auth |
|-------|------|
| `/auth/*` | public |
| `/content/public*` | public |
| `/content/*` (other) | JWT |
| `/pelayan/*` | JWT |
| `/users/me` | JWT |

### BFF Pattern (Next.js frontend)
- `app/api/auth/login/route.ts` proxies to this backend, sets the refresh cookie, returns the access token to the browser.
- Server-side routes that need the API forward the access token from the cookie/header on each call.
