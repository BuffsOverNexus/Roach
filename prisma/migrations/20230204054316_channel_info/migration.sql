/*
  Warnings:

  - Added the required column `channelId` to the `Guild` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelName` to the `Guild` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "channelId" TEXT NOT NULL,
ADD COLUMN     "channelName" TEXT NOT NULL;
