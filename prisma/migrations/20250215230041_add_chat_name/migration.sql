/*
  Warnings:

  - Added the required column `status` to the `DiscordChat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('active', 'stopped');

-- AlterTable
ALTER TABLE "DiscordChat" DROP COLUMN "status",
ADD COLUMN     "status" "ChatStatus" NOT NULL;
