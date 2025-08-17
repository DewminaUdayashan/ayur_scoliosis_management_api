import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AppUser, UserRole } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the full profile for a given user ID.
   * Includes related practitioner or patient data based on the user's role.
   */
  async getProfile(userId: string): Promise<Omit<AppUser, 'passwordHash'>> {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
      include: {
        practitioner: {
          include: {
            clinic: true, // Also include clinic details for practitioners
          },
        },
        patient: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Updates the profile for a given user.
   * Handles partial updates and an optional profile image URL.
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    profileImageUrl?: string,
  ): Promise<Omit<AppUser, 'passwordHash'>> {
    const user = await this.getProfile(userId); // Use getProfile to ensure user exists

    const { firstName, lastName, phone, specialty, dateOfBirth, gender } =
      updateProfileDto;

    // Use a transaction to ensure data integrity across multiple table updates
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // 1. Update the base AppUser table
      const updatedAppUser = await tx.appUser.update({
        where: { id: userId },
        data: {
          phone,
          firstName,
          lastName,
          profileImageUrl,
        },
      });

      // 2. Update the role-specific table (Practitioner or Patient)
      if (user.role === UserRole.Practitioner) {
        await tx.practitioner.update({
          where: { appUserId: userId },
          data: {
            specialty,
          },
        });
      } else if (user.role === UserRole.Patient) {
        await tx.patient.update({
          where: { appUserId: userId },
          data: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
          },
        });
      }

      return updatedAppUser;
    });

    // Return the full, updated profile
    return this.getProfile(updatedUser.id);
  }
}
