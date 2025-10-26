-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "sendBirthdayMessages" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Birthday" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "guildId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,

    CONSTRAINT "Birthday_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Birthday" ADD CONSTRAINT "Birthday_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
