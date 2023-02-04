/*
  Warnings:

  - Changed the type of `rawId` on the `Guild` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rawId` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "rawId",
ADD COLUMN     "rawId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "emoteName" TEXT,
ALTER COLUMN "emoteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rawId",
ADD COLUMN     "rawId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_rawId_key" ON "Guild"("rawId");

-- CreateIndex
CREATE UNIQUE INDEX "User_rawId_key" ON "User"("rawId");
