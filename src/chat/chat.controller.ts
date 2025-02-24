import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/common/guards/firebase-auth.guard';
import { DiscordChatService } from './chat.service';

@Controller('discord-accounts/:discordAccountId/chats')
@UseGuards(AuthGuard)
export class DiscordChatController {
  constructor(private readonly chatService: DiscordChatService) {}

  // Отримати всі чати для заданого Discord акаунта
  @Get()
  async getAllChats(
    @Req() req,
    @Param('discordAccountId') discordAccountId: string,
  ) {
    return this.chatService.getAllChats(req.user.uid, discordAccountId);
  }

  // Отримати чат за id
  @Get(':id')
  async getChatById(
    @Req() req,
    @Param('discordAccountId') discordAccountId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.getChatById(req.user.uid, discordAccountId, chatId);
  }

  // Створити новий чат
  @Post()
  async createChat(
    @Req() req,
    @Param('discordAccountId') discordAccountId: string,
    @Body()
    body: {
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
    return this.chatService.createChat(req.user.uid, discordAccountId, body);
  }

  // Оновити чат
  @Patch(':id')
  async updateChat(
    @Req() req,
    @Param('discordAccountId') discordAccountId: string,
    @Param('id') chatId: string,
    @Body()
    body: {
      discordChatId?: string;
      min_interval?: number;
      max_interval?: number;
      prompt_system?: string;
      prompt_user?: string;
      max_tokens?: number;
      temperature?: number;
      gpt_model?: string;
      status: 'active' | 'stopped';
    },
  ) {
    return this.chatService.updateChat(
      req.user.uid,
      discordAccountId,
      chatId,
      body,
    );
  }

  // Видалити чат
  @Delete(':id')
  async deleteChat(
    @Req() req,
    @Param('discordAccountId') discordAccountId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.deleteChat(req.user.uid, discordAccountId, chatId);
  }
}
