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
import { DiscordAccountService } from './accounts.service';

@Controller('discord-accounts')
@UseGuards(AuthGuard)
export class DiscordAccountController {
  constructor(private readonly discordAccountService: DiscordAccountService) {}

  @Get()
  async getAll(@Req() req) {
    return this.discordAccountService.getAllAccounts(req.user.uid);
  }

  @Get(':id')
  async getById(@Req() req, @Param('id') accountId: string) {
    return this.discordAccountService.getAccountById(req.user.uid, accountId);
  }

  @Post()
  async create(@Req() req, @Body() body) {
    return this.discordAccountService.createAccount(
      req.user.uid,
      body.name,
      body.accountToken,
    );
  }

  @Patch(':id')
  async update(@Req() req, @Param('id') accountId: string, @Body() body) {
    return this.discordAccountService.updateAccount(
      req.user.uid,
      accountId,
      body.name,
      body.accountToken,
    );
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') accountId: string) {
    return this.discordAccountService.deleteAccount(req.user.uid, accountId);
  }
}
