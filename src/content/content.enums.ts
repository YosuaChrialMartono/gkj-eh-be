/**
 * Canonical content enums. Backend is the source of truth; the frontend
 * mirrors these string values in `lib/types/content.ts`.
 */
export enum ContentType {
  Article = "article",
  Page = "page",
  Sermon = "sermon",
  Announcement = "announcement",
}

export enum ContentStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}
