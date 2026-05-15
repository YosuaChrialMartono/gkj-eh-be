import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PelayanPerson } from "../pelayan/entities/pelayan-person.entity";
import { MembersController } from "./members.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PelayanPerson])],
  controllers: [MembersController],
})
export class MembersModule {}
