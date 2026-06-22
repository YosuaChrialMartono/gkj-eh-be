import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { UserRole } from "../../users/user-role.enum";

function contextFor(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWithRequired(required: UserRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe("RolesGuard", () => {
  it("allows any authenticated user when no @Roles is set", () => {
    const guard = guardWithRequired(undefined);
    expect(guard.canActivate(contextFor({ role: UserRole.Viewer }))).toBe(true);
  });

  it("allows a user whose role is in the required set", () => {
    const guard = guardWithRequired([UserRole.Admin, UserRole.Editor]);
    expect(guard.canActivate(contextFor({ role: UserRole.Editor }))).toBe(true);
  });

  it("forbids a viewer from a content-manager route", () => {
    const guard = guardWithRequired([UserRole.Admin, UserRole.Editor]);
    expect(() => guard.canActivate(contextFor({ role: UserRole.Viewer }))).toThrow(
      ForbiddenException,
    );
  });

  it("forbids when no user / role is present", () => {
    const guard = guardWithRequired([UserRole.Admin]);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
