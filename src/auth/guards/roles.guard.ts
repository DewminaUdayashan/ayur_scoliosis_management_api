import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, AppUser } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for the specific route handler from the @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user object from the request.
    // The user object is attached by the JwtAuthGuard after validating the token.
    // We explicitly type the user object to avoid 'any' type issues.
    // The type Omit<AppUser, 'passwordHash'> matches what our JwtStrategy returns.
    const { user }: { user: Omit<AppUser, 'passwordHash'> } = context
      .switchToHttp()
      .getRequest();

    // If there is no user or the user doesn't have a role, deny access
    if (!user || !user.role) {
      return false;
    }

    // Check if the user's role is present in the list of required roles.
    // The .some() method returns true if at least one required role matches the user's role.
    return requiredRoles.some((role) => user.role === role);
  }
}
