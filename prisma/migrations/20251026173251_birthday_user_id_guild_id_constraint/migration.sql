/*
  Warnings:

  - A unique constraint covering the columns `[userId,guildId]` on the table `Birthday` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Birthday_userId_guildId_key" ON "Birthday"("userId", "guildId");
