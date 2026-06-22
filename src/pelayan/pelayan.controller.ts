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
  ServicesQueryDto,
  AssignmentsQueryDto,
} from "./dto/pelayan.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("pelayan")
@UseGuards(JwtAuthGuard)
export class PelayanController {
  constructor(private readonly pelayanService: PelayanService) {}

  @Get("roles")
  findAllRoles() {
    return this.pelayanService.findAllRoles();
  }

  @Post("roles")
  createRole(@Body() dto: CreatePelayanRoleDto) {
    return this.pelayanService.createRole(dto);
  }

  @Put("roles/:id")
  updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelayanRoleDto,
  ) {
    return this.pelayanService.updateRole(id, dto);
  }

  @Delete("roles/:id")
  deleteRole(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteRole(id);
  }

  @Get("persons")
  findAllPersons() {
    return this.pelayanService.findAllPersons();
  }

  @Post("persons")
  createPerson(@Body() dto: CreatePelayanPersonDto) {
    return this.pelayanService.createPerson(dto);
  }

  @Delete("persons/:id")
  deletePerson(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deletePerson(id);
  }

  @Get("services")
  findAllServices(@Query() query: ServicesQueryDto) {
    return this.pelayanService.findAllServices(query.month);
  }

  @Post("services")
  createService(@Body() dto: CreatePelayanServiceDto) {
    return this.pelayanService.createService(dto);
  }

  @Put("services/:id")
  updateService(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePelayanServiceDto,
  ) {
    return this.pelayanService.updateService(id, dto);
  }

  @Delete("services/:id")
  deleteService(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteService(id);
  }

  @Get("assignments")
  findAllAssignments(@Query() query: AssignmentsQueryDto) {
    return this.pelayanService.findAllAssignments(query.serviceId);
  }

  @Post("assignments")
  upsertAssignment(@Body() dto: UpsertPelayanAssignmentDto) {
    return this.pelayanService.upsertAssignment(dto);
  }

  @Delete("assignments/:id")
  deleteAssignment(@Param("id", ParseUUIDPipe) id: string) {
    return this.pelayanService.deleteAssignment(id);
  }
}
