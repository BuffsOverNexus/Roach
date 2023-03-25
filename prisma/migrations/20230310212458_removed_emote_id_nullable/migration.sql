/*
  Warnings:

  - Made the column `emoteId` on table `Reaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Reaction" ALTER COLUMN "emoteId" SET NOT NULL;
