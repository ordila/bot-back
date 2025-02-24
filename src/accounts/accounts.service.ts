import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DiscordAccountService {
  constructor(private prisma: PrismaService) {}

  // Допоміжний метод для отримання user.id за firebaseUid
  private async getUserIdByFirebaseUid(firebaseUid: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return user.id;
  }

  // Отримати всі акаунти користувача
  async getAllAccounts(firebaseUid: string) {
    const userId = await this.getUserIdByFirebaseUid(firebaseUid);
    return this.prisma.discordAccount.findMany({
      where: { userId },
    });
  }

  // Отримати один акаунт
  async getAccountById(firebaseUid: string, accountId: string) {
    const userId = await this.getUserIdByFirebaseUid(firebaseUid);
    const account = await this.prisma.discordAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Акаунт не знайдено');
    }

    return account;
  }

  // Створити новий Discord акаунт
  async createAccount(firebaseUid: string, name: string, accountToken: string) {
    const userId = await this.getUserIdByFirebaseUid(firebaseUid);

    return this.prisma.discordAccount.create({
      data: { name, accountToken, userId },
    });
  }

  // Оновити акаунт
  async updateAccount(
    firebaseUid: string,
    accountId: string,
    name?: string,
    accountToken?: string,
  ) {
    // Переконуємося, що акаунт належить користувачу
    await this.getAccountById(firebaseUid, accountId);

    return this.prisma.discordAccount.update({
      where: { id: accountId },
      data: { name, accountToken },
    });
  }

  // Видалити акаунт
  async deleteAccount(firebaseUid: string, accountId: string) {
    // Переконуємося, що акаунт належить користувачу
    await this.getAccountById(firebaseUid, accountId);

    return this.prisma.discordAccount.delete({
      where: { id: accountId },
    });
  }
}
