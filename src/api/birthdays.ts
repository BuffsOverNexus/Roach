import { PrismaClient } from "@prisma/client";

export async function getBirthdaysInGuild(prisma: PrismaClient, guildId: number) {
    try {
        const birthdays = await prisma.birthday.findMany({
            where: {
                guildId: guildId
            }
        });
        return birthdays;
    } catch (error) {
        return [];
    }
}

export async function getBirthdayInGuild(prisma: PrismaClient, guildId: number, userId: string) {
    try {
        const birthday = await prisma.birthday.findFirst({
            where: {
                userId: userId,
                guildId: guildId
            }
        });
        return birthday;
    } catch (error) {
        return null;
    }
}

export async function deleteBirthdayInGuild(prisma: PrismaClient, guildId: number, userId: string) {
    try {
        const deleted = await prisma.birthday.deleteMany({
            where: {
                userId: userId,
                guildId: guildId
            }
        });
        return deleted.count > 0;
    } catch (error) {
        return false;
    }
}