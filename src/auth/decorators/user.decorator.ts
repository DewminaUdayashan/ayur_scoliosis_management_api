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
 * This decorator extracts the user object from the request. It can also
 * extract a specific property from the user object if a key is provided.
 *
 * @example
 * // Get the entire user object
 * @GetUser() user: Omit<AppUser, 'passwordHash'>
 *
 * // Get a specific property (e.g., the user's ID)
 * @GetUser('id') userId: string
 */
export const GetUser = createParamDecorator(
  (data: keyof Omit<AppUser, 'passwordHash'>, ctx: ExecutionContext) => {
    const request: RequestWithUser = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a data key (like 'id' or 'email') is provided, return that specific property.
    // Otherwise, return the entire user object.
    return data ? user?.[data] : user;
  },
);
