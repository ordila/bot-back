import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import { DiscordAccountController } from './accounts.controller';
import { DiscordAccountService } from './accounts.service';

@Module({
  controllers: [DiscordAccountController],
  providers: [DiscordAccountService, PrismaService],
})
export class discordAccountModule {}
