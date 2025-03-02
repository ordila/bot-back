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

/**
 * Функція перевіряє, чи підтримує модель system prompt.
 */
function modelSupportsSystemPrompt(model: string): boolean {
  const modelsWithSystemPrompt = [
    'gpt-4.5-preview',
    'gpt-4.5-preview-2025-02-27',
    'gpt-4o-mini-realtime-preview-2024-12-17',
    'gpt-4o-mini-realtime-preview',
    'gpt-4-turbo',
    'gpt-4o-realtime-preview-2024-10-01',
    'gpt-4',
    'chatgpt-4o-latest',
    'gpt-4-turbo-preview',
    'gpt-4-0125-preview',
    'gpt-4-turbo-2024-04-09',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-instruct',
    'gpt-4o-2024-11-20',
    'gpt-3.5-turbo-instruct-0914',
    'gpt-3.5-turbo-0125',
    'gpt-4o-realtime-preview-2024-12-17',
    'gpt-3.5-turbo',
    'gpt-4o-realtime-preview',
    'gpt-3.5-turbo-16k',
    'gpt-4-1106-preview',
    'gpt-4-0613',
    'gpt-4o-mini-2024-07-18',
    'gpt-4o-2024-05-13',
    'gpt-4o-mini',
    'gpt-4o-2024-08-06',
    'gpt-4o',
  ];
  return modelsWithSystemPrompt.includes(model);
}

/**
 * Функція визначає, чи модель належить до o1-серії.
 * Для моделей о1-серії використовуються: max_completion_tokens замість max_tokens,
 * а також підтримується лише стандартне значення temperature (1).
 */
function isO1Series(model: string): boolean {
  return model.startsWith('o1-') || model === 'o1';
}

/**
 * Формуємо повідомлення для запиту до OpenAI API залежно від можливостей моделі.
 */
function formatMessages(
  model: string,
  systemPrompt?: string,
  userPrompt?: string,
): { role: string; content: string }[] {
  if (modelSupportsSystemPrompt(model)) {
    return [
      { role: 'system', content: systemPrompt || '...' },
      { role: 'user', content: userPrompt || '...' },
    ];
  } else {
    const combined = `${systemPrompt || ''}\n${userPrompt || ''}`.trim();
    return [{ role: 'user', content: combined }];
  }
}

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

      const model = updatedChat.gpt_model || 'gpt-4o-mini';
      const messages = formatMessages(
        model,
        updatedChat.prompt_system,
        updatedChat.prompt_user,
      );

      // Формуємо параметри запиту залежно від моделі
      const requestPayload: any = {
        model: model,
        messages: messages as any,
      };

      // Якщо модель належить до o1-серії, використовуємо max_completion_tokens та примусово temperature=1.
      if (isO1Series(model)) {
        requestPayload.max_completion_tokens = updatedChat.max_tokens || 100;
        requestPayload.temperature = 1;
      } else {
        requestPayload.max_tokens = updatedChat.max_tokens || 100;
        requestPayload.temperature = updatedChat.temperature || 0.7;
      }

      try {
        const response = await openai.chat.completions.create(requestPayload);
        console.log('response', response);
        const aiMessage = response.choices[0].message.content;
        await channel.send(aiMessage);
      } catch (error) {
        console.error('❌ Помилка OpenAI API:', error);
      }

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
      activeBots.set(chatId, { client, chatId, intervalId });
    };

    sendMessage();
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
