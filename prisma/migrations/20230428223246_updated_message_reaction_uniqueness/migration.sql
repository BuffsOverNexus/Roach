/*
  Warnings:

  - A unique constraint covering the columns `[rawId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emoteId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Message_rawId_key" ON "Message"("rawId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_emoteId_key" ON "Reaction"("emoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_roleId_key" ON "Reaction"("roleId");
