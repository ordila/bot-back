import { Client, TextChannel } from 'discord.js-selfbot-v13';
import OpenAI from 'openai';

import { ChatStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BotInstance {
  client: Client;
  chatId: string;
  intervalId: NodeJS.Timeout;
}

const activeBots: Map<string, BotInstance> = new Map();

// ✅ Запуск бота
export const startBot = async (chatId: string) => {
  if (activeBots.has(chatId)) {
    console.log(`⚠️ Бот для чату ${chatId} вже запущений.`);
    return;
  }
  const chat = await prisma.discordChat.findUnique({
    where: { id: chatId },
    include: {
      discordAccount: {
        include: { user: true },
      },
    },
  });

  if (!chat || chat.status !== ChatStatus.active) {
    console.log(
      `⚠️ Неможливо запустити бота для чату ${chatId}: статус не "active".`,
    );
    return;
  }
  console.log('chat', chat);
  console.log(`🚀 Запускаємо бота для чату ${chatId}...`);
  const client = new Client();
  const openaiApiKey = chat.discordAccount.user.openai_api_key;

  console.log('openaiApiKey', openaiApiKey);

  const openai = new OpenAI({ apiKey: openaiApiKey });

  client.on('ready', async () => {
    console.log(`✅ Бот увійшов як ${client.user?.tag} для чату ${chatId}`);

    const sendMessage = async () => {
      const updatedChat = await prisma.discordChat.findUnique({
        where: { id: chatId },
      });

      if (!updatedChat || updatedChat.status === ChatStatus.stopped) {
        console.log(
          `🛑 Бот для чату ${chatId} зупиняється через статус "stopped".`,
        );
        await stopBot(chatId);
        return;
      }

      const channel = client.channels.cache.get(
        updatedChat.discordChatId,
      ) as TextChannel;

      if (!channel) {
        console.error(
          `❌ Канал ${updatedChat.discordChatId} не знайдено або це не текстовий канал! Бот зупиняється.`,
        );
        await stopBot(chatId);
        return;
      }

      const messages = [
        { role: 'system', content: updatedChat.prompt_system || '...' },
        { role: 'user', content: updatedChat.prompt_user || '...' },
      ];

      try {
        const response = await openai.chat.completions.create({
          model: updatedChat.gpt_model || 'gpt-4o-mini',
          messages: messages as any,
          max_tokens: updatedChat.max_tokens || 100,
          temperature: updatedChat.temperature || 0.7,
        });

        const aiMessage = response.choices[0].message.content;
        await channel.send(aiMessage);
      } catch (error) {
        console.error('❌ Помилка OpenAI API:', error);
      }

      // Генеруємо інтервал
      const interval =
        updatedChat.min_interval === updatedChat.max_interval
          ? updatedChat.min_interval * 1000
          : (Math.floor(
              Math.random() *
                (updatedChat.max_interval - updatedChat.min_interval + 1),
            ) +
              updatedChat.min_interval) *
            1000;

      console.log(`⏳ Наступне повідомлення через ${interval / 1000} секунд.`);

      const intervalId = setTimeout(sendMessage, interval);
      activeBots.set(chatId, { client, chatId, intervalId }); // Оновлюємо activeBots
    };

    sendMessage(); // Викликаємо одразу після логіну
  });

  client.login(chat.discordAccount.accountToken);
};

// ✅ Зупинка бота
export const stopBot = async (chatId: string) => {
  const botInstance = activeBots.get(chatId);
  if (!botInstance) return;

  clearInterval(botInstance.intervalId);
  botInstance.client.destroy();
  activeBots.delete(chatId);
  console.log(`🛑 Бот для чату ${chatId} зупинено.`);
};

// ✅ Автоматичне оновлення статусу (запуск/зупинка)
export const updateBotStatus = async (chatId: string) => {
  const chat = await prisma.discordChat.findUnique({
    where: { id: chatId },
  });

  if (!chat) return;

  if (chat.status === ChatStatus.active) {
    startBot(chatId);
  } else {
    stopBot(chatId);
  }
};

// ✅ Перевірка, чи бот працює
export const isBotRunning = (chatId: string): boolean => {
  return activeBots.has(chatId);
};

// ✅ Перезапуск всіх активних ботів після рестарту сервера
export const restartActiveBots = async () => {
  console.log('🔄 Перевіряємо активні чати для перезапуску...');

  const activeChats = await prisma.discordChat.findMany({
    where: { status: ChatStatus.active },
    include: { discordAccount: true },
  });

  if (!activeChats.length) {
    console.log('✅ Немає активних чатів для запуску.');
    return;
  }

  for (const chat of activeChats) {
    console.log(
      `🔑 Токен для чату ${chat.id}:`,
      chat.discordAccount.accountToken
        ? chat.discordAccount.accountToken.slice(0, 10) + '...'
        : '❌ Немає токена!',
    );

    if (!chat.discordAccount.accountToken) {
      console.error(`❌ Чат ${chat.id} не має токена!`);
      continue;
    }

    console.log(`🚀 Перезапускаємо бота для чату ${chat.id}...`);
    await startBot(chat.id);
  }

  console.log('✅ Всі активні боти перезапущено!');
};
