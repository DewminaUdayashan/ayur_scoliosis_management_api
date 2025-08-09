import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppUser } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// Define the shape of the JWT payload for type safety
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string; // JTI is optional to handle the temporary token
  mustChangePassword?: boolean; // Flag for temporary token
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<Omit<AppUser, 'passwordHash'> & { jti?: string; exp: number }> {
    // Add a check to ensure the token has a JTI. This is crucial for the
    // sign-out functionality and handles old tokens that were issued
    // before the JTI claim was added.
    // We bypass this check only for the temporary 'mustChangePassword' token.
    if (!payload.mustChangePassword && !payload.jti) {
      throw new UnauthorizedException(
        'Token is missing a required identifier (jti). Please log in again to get a new token.',
      );
    }

    // If the token has a JTI, check if it has been revoked.
    if (payload.jti) {
      const isRevoked = await this.prisma.revokedToken.findUnique({
        where: { jti: payload.jti },
      });
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked.');
      }
    }

    const user = await this.prisma.appUser.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    return { ...result, jti: payload.jti, exp: payload.exp };
  }
}
