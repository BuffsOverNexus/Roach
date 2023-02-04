import { PrismaClient } from "@prisma/client";
import { getUser } from "./users";

export async function createGuild(prisma: PrismaClient, userId: string, guildId: string, name: string) {
    // Acquire user
    const user = await getUser(prisma, userId);
    if (user) {
        const guildExists = await getGuild(prisma, guildId);

        if (!guildExists) {
            const createdGuild = await prisma.guild.create({
                data: {
                    rawId: guildId,
                    name: name,
                    userId: user.id
                }
            });
            return createdGuild;
        } else {
            return guildExists;
        }
    }
    return null;
}

export async function getGuild(prisma: PrismaClient, guildId: string) {
    const guild = await prisma.guild.findUnique({
        where: { rawId: guildId }
    });
    return guild;
}

export async function getGuildsFromUser(prisma: PrismaClient, rawId: string) {
    const user = await prisma.user.findUnique({
        where: { rawId },
        include: {
            guilds: true
        }
    });
    if (user) {
        return user.guilds;
    }
    return null;
}