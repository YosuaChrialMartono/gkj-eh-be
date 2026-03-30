import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("content")
export class Content {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text", unique: true })
  slug: string;

  @Column({ type: "text" })
  type: string;

  @Column({ type: "text", default: "draft" })
  status: string;

  @Column({ type: "text", default: "" })
  body: string;

  @Column({ type: "text", default: "" })
  bodyHtml: string;

  @Column({ name: "author_id", type: "uuid" })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "author_id" })
  author: User;

  @Column({ name: "featured_image_url", type: "text", nullable: true })
  featuredImageUrl: string | null;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
