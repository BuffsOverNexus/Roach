/*
  Warnings:

  - Changed the type of `messageId` on the `Reaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `emoteId` on the `Reaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roleId` on the `Reaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "messageId",
ADD COLUMN     "messageId" INTEGER NOT NULL,
DROP COLUMN "emoteId",
ADD COLUMN     "emoteId" INTEGER NOT NULL,
DROP COLUMN "roleId",
ADD COLUMN     "roleId" INTEGER NOT NULL;
