import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { Request } from 'express';

/**
 * Defines a custom type for the Express Request object,
 * including the 'user' property that will be attached by our JWT strategy.
 * This avoids using 'any' and provides strong typing for the request payload.
 */
interface RequestWithUser extends Request {
  user: Omit<AppUser, 'passwordHash'>;
}

/**
 * @GetUser() custom parameter decorator.
 *
 * This decorator extracts the user object from the request, which is attached
 * by the JwtAuthGuard after successful token validation. It provides a clean
 * and type-safe way to access the authenticated user in your controllers.
 *
 * @example
 * @Get('profile')
 * getProfile(@GetUser() user: Omit<AppUser, 'passwordHash'>) {
 * return user;
 * }
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Omit<AppUser, 'passwordHash'> => {
    // Switch to the HTTP context and get the request object
    const request: RequestWithUser = ctx.switchToHttp().getRequest();
    // Return the user property from the typed request object
    return request.user;
  },
);
