/**
 * Canonical user roles. Backend is the single source of truth; the frontend
 * mirrors these string values in `lib/types/auth.ts`.
 */
export enum UserRole {
  Admin = "admin",
  Editor = "editor",
  Viewer = "viewer",
}

/** Roles allowed to create/update/delete CMS content + scheduling data. */
export const CONTENT_MANAGER_ROLES = [UserRole.Admin, UserRole.Editor];
