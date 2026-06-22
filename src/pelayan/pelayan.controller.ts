import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PelayanService } from "./pelayan.service";
import {
  CreatePelayanRoleDto,
  UpdatePelayanRoleDto,
  CreatePelayanPersonDto,
  CreatePelayanServiceDto,
  UpdatePelayanServiceDto,
  UpsertPelayanAssignmentDto,
} from "./dto/pelayan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CONTENT_MANAGER_ROLES } from "../users/user-role.enum";

@Controller("pelayan")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PelayanController {
  constructor(private readonly pelayanService: PelayanService) {}

  @Get("roles")
  findAllRoles() {
    return this.pelayanService.findAllRoles();
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Post("roles")
  createRole(@Body() dto: CreatePelayanRoleDto) {
    return this.pelayanService.createRole(dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Put("roles/:id")
  updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelayanRoleDto,
  ) {
    return this.pelayanService.updateRole(id, dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete("roles/:id")
  deleteRole(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteRole(id);
  }

  @Get("persons")
  findAllPersons() {
    return this.pelayanService.findAllPersons();
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Post("persons")
  createPerson(@Body() dto: CreatePelayanPersonDto) {
    return this.pelayanService.createPerson(dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete("persons/:id")
  deletePerson(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deletePerson(id);
  }

  @Get("services")
  findAllServices() {
    return this.pelayanService.findAllServices();
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Post("services")
  createService(@Body() dto: CreatePelayanServiceDto) {
    return this.pelayanService.createService(dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Put("services/:id")
  updateService(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelayanServiceDto,
  ) {
    return this.pelayanService.updateService(id, dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete("services/:id")
  deleteService(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteService(id);
  }

  @Get("assignments")
  findAllAssignments() {
    return this.pelayanService.findAllAssignments();
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Post("assignments")
  upsertAssignment(@Body() dto: UpsertPelayanAssignmentDto) {
    return this.pelayanService.upsertAssignment(dto);
  }

  @Roles(...CONTENT_MANAGER_ROLES)
  @Delete("assignments/:id")
  deleteAssignment(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteAssignment(id);
  }
}
