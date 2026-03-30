import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PelayanRole } from "./entities/pelayan-role.entity";
import { PelayanPerson } from "./entities/pelayan-person.entity";
import { PelayanServiceEntity } from "./entities/pelayan-service.entity";
import { PelayanAssignment } from "./entities/pelayan-assignment.entity";
import { PelayanService } from "./pelayan.service";
import { PelayanController } from "./pelayan.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PelayanRole,
      PelayanPerson,
      PelayanServiceEntity,
      PelayanAssignment,
    ]),
  ],
  providers: [PelayanService],
  controllers: [PelayanController],
  exports: [PelayanService],
})
export class PelayanModule {}
