/*
  Warnings:

  - You are about to drop the `ChatSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_session_id_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "openai_api_key" TEXT;

-- DropTable
DROP TABLE "ChatSession";

-- DropTable
DROP TABLE "Message";

-- CreateTable
CREATE TABLE "DiscordAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountToken" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "DiscordAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordChat" (
    "id" TEXT NOT NULL,
    "discord_account_id" TEXT NOT NULL,
    "discordChatId" TEXT NOT NULL,
    "min_interval" INTEGER NOT NULL,
    "max_interval" INTEGER NOT NULL,
    "prompt_system" TEXT,
    "prompt_user" TEXT,
    "max_tokens" INTEGER,
    "temperature" DOUBLE PRECISION,
    "gpt_model" TEXT,
    "status" TEXT,

    CONSTRAINT "DiscordChat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiscordAccount" ADD CONSTRAINT "DiscordAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordChat" ADD CONSTRAINT "DiscordChat_discord_account_id_fkey" FOREIGN KEY ("discord_account_id") REFERENCES "DiscordAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
