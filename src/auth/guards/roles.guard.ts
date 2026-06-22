import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { UserRole } from "../../users/user-role.enum";

/**
 * Enforces `@Roles(...)`. Relies on `JwtAuthGuard` having populated
 * `req.user` (with a DB-sourced `role`) first, so list it AFTER JwtAuthGuard
 * in `@UseGuards(...)`. Routes without `@Roles` are unrestricted (any
 * authenticated user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: UserRole };
    }>();
    const role = request.user?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException("Insufficient role for this action");
    }

    return true;
  }
}
