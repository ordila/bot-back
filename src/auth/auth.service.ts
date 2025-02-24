import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async registerUser(email: string, firebaseUid: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { message: 'Користувач вже існує' };
    }

    return await this.prisma.user.create({
      data: { email, firebaseUid },
    });
  }

  async findUser(firebaseUid: string) {
    return await this.prisma.user.findUnique({ where: { firebaseUid } });
  }
}
