import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("pelayan_services")
export class PelayanServiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "text", nullable: true })
  label: string;

  @Column({ name: "is_extra", type: "boolean", default: false })
  isExtra: boolean;
}
