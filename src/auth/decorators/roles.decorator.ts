import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../users/user-role.enum";

export const ROLES_KEY = "roles";

/**
 * Restrict a route (or whole controller) to the given roles.
 * Must be combined with `JwtAuthGuard` + `RolesGuard` so `req.user` is set.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
