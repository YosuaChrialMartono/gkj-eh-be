import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { PelayanServiceEntity } from "./pelayan-service.entity";
import { PelayanRole } from "./pelayan-role.entity";

@Entity("pelayan_assignments")
@Unique(["serviceId", "roleId"])
export class PelayanAssignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "service_id", type: "uuid" })
  serviceId: string;

  @ManyToOne(() => PelayanServiceEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "service_id" })
  service: PelayanServiceEntity;

  @Column({ name: "role_id", type: "uuid" })
  roleId: string;

  @ManyToOne(() => PelayanRole, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role: PelayanRole;

  @Column({ name: "pelayan_name", type: "text" })
  pelayanName: string;
}
