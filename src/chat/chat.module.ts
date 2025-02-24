import { Module } from '@nestjs/common';

import { PrismaModule } from 'prisma/prisma.module';
import { DiscordChatController } from './chat.controller';
import { DiscordChatService } from './chat.service';

@Module({
  imports: [PrismaModule],
  controllers: [DiscordChatController],
  providers: [DiscordChatService],
})
export class DiscordChatModule {}
