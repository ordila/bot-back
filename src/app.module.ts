import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { discordAccountModule } from './accounts/accounts.module';
import { DiscordChatModule } from './chat/chat.module';

@Module({
  controllers: [],
  providers: [],
  imports: [AuthModule, UserModule, discordAccountModule, DiscordChatModule],
})
export class AppModule {}
