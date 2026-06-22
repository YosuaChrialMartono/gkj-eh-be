import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exclude } from "class-transformer";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", unique: true })
  email: string;

  // Global safety net: never serialized in any response, even if a User
  // entity is returned directly from a controller. See ClassSerializerInterceptor
  // registered in main.ts.
  @Exclude()
  @Column({ type: "text", nullable: true })
  password: string | null;

  @Column({ type: "text", nullable: true })
  avatar: string;

  @Column({ type: "text", default: "viewer" })
  role: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
