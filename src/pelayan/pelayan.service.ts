import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository } from "typeorm";
import { PelayanRole } from "./entities/pelayan-role.entity";
import { PelayanPerson } from "./entities/pelayan-person.entity";
import { PelayanServiceEntity } from "./entities/pelayan-service.entity";
import { PelayanAssignment } from "./entities/pelayan-assignment.entity";
import {
  CreatePelayanRoleDto,
  UpdatePelayanRoleDto,
  CreatePelayanPersonDto,
  CreatePelayanServiceDto,
  UpdatePelayanServiceDto,
  UpsertPelayanAssignmentDto,
} from "./dto/pelayan.dto";

/** "2026-06" -> "2026-07-01"; "2026-12" -> "2027-01-01". */
export function nextMonthStart(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const nextYear = mon === 12 ? year + 1 : year;
  const nextMon = mon === 12 ? 1 : mon + 1;
  return `${nextYear}-${String(nextMon).padStart(2, "0")}-01`;
}

@Injectable()
export class PelayanService {
  constructor(
    @InjectRepository(PelayanRole)
    private roleRepository: Repository<PelayanRole>,
    @InjectRepository(PelayanPerson)
    private personRepository: Repository<PelayanPerson>,
    @InjectRepository(PelayanServiceEntity)
    private serviceRepository: Repository<PelayanServiceEntity>,
    @InjectRepository(PelayanAssignment)
    private assignmentRepository: Repository<PelayanAssignment>,
  ) {}

  async findAllRoles(): Promise<PelayanRole[]> {
    return this.roleRepository.find({ order: { order: "ASC" } });
  }

  async createRole(dto: CreatePelayanRoleDto): Promise<PelayanRole> {
    const role = this.roleRepository.create({
      name: dto.name,
      order: dto.order || 0,
    });
    return this.roleRepository.save(role);
  }

  async updateRole(
    id: string,
    dto: UpdatePelayanRoleDto,
  ): Promise<PelayanRole> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    Object.assign(role, dto);
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    await this.roleRepository.remove(role);
  }

  async findAllPersons(): Promise<PelayanPerson[]> {
    return this.personRepository.find();
  }

  async createPerson(dto: CreatePelayanPersonDto): Promise<PelayanPerson> {
    const person = this.personRepository.create({ name: dto.name });
    return this.personRepository.save(person);
  }

  async deletePerson(id: string): Promise<void> {
    const person = await this.personRepository.findOne({ where: { id } });
    if (!person) {
      throw new NotFoundException("Person not found");
    }
    await this.personRepository.remove(person);
  }

  async findAllServices(month?: string): Promise<PelayanServiceEntity[]> {
    // Filter to a single calendar month via a half-open range
    // [YYYY-MM-01, next-month-01) so we never build an invalid date literal.
    const where = month
      ? {
          date: Raw((alias) => `${alias} >= :start AND ${alias} < :end`, {
            start: `${month}-01`,
            end: nextMonthStart(month),
          }),
        }
      : {};
    return this.serviceRepository.find({ where, order: { date: "ASC" } });
  }

  async createService(
    dto: CreatePelayanServiceDto,
  ): Promise<PelayanServiceEntity> {
    const service = this.serviceRepository.create({
      date: dto.date,
      label: dto.label,
      isExtra: dto.isExtra || false,
    });
    return this.serviceRepository.save(service);
  }

  async updateService(
    id: string,
    dto: UpdatePelayanServiceDto,
  ): Promise<PelayanServiceEntity> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException("Service not found");
    }
    Object.assign(service, dto);
    return this.serviceRepository.save(service);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException("Service not found");
    }
    await this.serviceRepository.remove(service);
  }

  async findAllAssignments(serviceId?: string): Promise<PelayanAssignment[]> {
    return this.assignmentRepository.find({
      where: serviceId ? { serviceId } : {},
      relations: ["service", "role"],
    });
  }

  async upsertAssignment(
    dto: UpsertPelayanAssignmentDto,
  ): Promise<PelayanAssignment> {
    let assignment = await this.assignmentRepository.findOne({
      where: { serviceId: dto.serviceId, roleId: dto.roleId },
    });

    if (assignment) {
      assignment.pelayanName = dto.pelayanName;
    } else {
      assignment = this.assignmentRepository.create(dto);
    }

    return this.assignmentRepository.save(assignment);
  }

  async deleteAssignment(id: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }
    await this.assignmentRepository.remove(assignment);
  }
}
