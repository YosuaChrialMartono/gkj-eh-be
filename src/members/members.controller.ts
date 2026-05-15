import { Controller, Get, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PelayanPerson } from "../pelayan/entities/pelayan-person.entity";

@Controller("members")
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(
    @InjectRepository(PelayanPerson)
    private personRepo: Repository<PelayanPerson>,
  ) {}

  @Get()
  async list(): Promise<string[]> {
    const persons = await this.personRepo.find({ order: { name: "ASC" } });
    return persons.map((p) => p.name);
  }
}
