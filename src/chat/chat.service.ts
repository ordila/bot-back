import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { startBot, stopBot } from 'src/lib/botManager/botManager';

@Injectable()
export class DiscordChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Допоміжний метод для перевірки, що Discord акаунт належить користувачу.
   */
  private async getDiscordAccountForUser(
    firebaseUid: string,
    discordAccountId: string,
  ) {
    const account = await this.prisma.discordAccount.findFirst({
      where: {
        id: discordAccountId,
        user: { firebaseUid }, // Припускаємо, що зв'язок налаштовано
      },
    });
    if (!account) {
      throw new NotFoundException(
        'Discord акаунт не знайдено або він не належить цьому користувачу',
      );
    }
    return account;
  }

  // Отримати всі чати для заданого Discord акаунта
  async getAllChats(firebaseUid: string, discordAccountId: string) {
    await this.getDiscordAccountForUser(firebaseUid, discordAccountId);
    return this.prisma.discordChat.findMany({
      where: { discordAccountId },
    });
  }

  // Отримати чат за його id
  async getChatById(
    firebaseUid: string,
    discordAccountId: string,
    chatId: string,
  ) {
    await this.getDiscordAccountForUser(firebaseUid, discordAccountId);
    const chat = await this.prisma.discordChat.findFirst({
      where: {
        id: chatId,
        discordAccountId,
      },
    });
    if (!chat) {
      throw new NotFoundException('Чат не знайдено');
    }
    return chat;
  }

  // Створити новий чат
  async createChat(
    firebaseUid: string,
    discordAccountId: string,
    data: {
      name: string;
      discordChatId: string;
      min_interval: number;
      max_interval: number;
      prompt_system?: string;
      prompt_user?: string;
      max_tokens?: number;
      temperature?: number;
      gpt_model?: string;
      status: 'active' | 'stopped';
    },
  ) {
    await this.getDiscordAccountForUser(firebaseUid, discordAccountId);
    return this.prisma.discordChat.create({
      data: {
        discordAccountId,
        ...data,
      },
    });
  }

  // Оновити існуючий чат
  async updateChat(
    firebaseUid: string,
    discordAccountId: string,
    chatId: string,
    data: {
      discordChatId?: string;
      min_interval?: number;
      max_interval?: number;
      prompt_system?: string;
      prompt_user?: string;
      max_tokens?: number;
      temperature?: number;
      gpt_model?: string;
      status?: 'active' | 'stopped';
    },
  ) {
    await this.getDiscordAccountForUser(firebaseUid, discordAccountId);
    const existingChat = await this.getChatById(
      firebaseUid,
      discordAccountId,
      chatId,
    );

    if (!existingChat) {
      throw new NotFoundException('Чат не знайдено');
    }

    if (
      data.min_interval &&
      data.max_interval &&
      data.min_interval > data.max_interval
    ) {
      throw new BadRequestException(
        'Мінімальний інтервал не може бути більше за максимальний',
      );
    }

    // Оновлюємо чат
    const updatedChat = await this.prisma.discordChat.update({
      where: { id: chatId },
      data,
    });

    // 🛑 **Зупиняємо бота перед перезапуском, якщо змінилися критичні параметри**
    const needsRestart = [
      'min_interval',
      'max_interval',
      'prompt_system',
      'prompt_user',
      'max_tokens',
      'temperature',
      'gpt_model',
    ].some((key) => key in data);

    if (needsRestart || (data.status && data.status !== existingChat.status)) {
      await stopBot(updatedChat.id);
    }

    // ✅ **Запускаємо бота з оновленими параметрами, якщо статус = 'active'**
    if (updatedChat.status === 'active') {
      await startBot(updatedChat.id);
    }

    return updatedChat;
  }

  // Видалити чат
  async deleteChat(
    firebaseUid: string,
    discordAccountId: string,
    chatId: string,
  ) {
    await this.getDiscordAccountForUser(firebaseUid, discordAccountId);
    await this.getChatById(firebaseUid, discordAccountId, chatId);
    return this.prisma.discordChat.delete({
      where: { id: chatId },
    });
  }
}
