import { PrismaClient } from "@prisma/client";
import { getUser } from "./users";

export async function createGuild(prisma: PrismaClient, userId: string, guildId: string, name: string, channelId: string, channelName: string) {
    // Acquire user
    const user = await getUser(prisma, userId);
    if (user) {
        const guildExists = await getGuild(prisma, guildId);

        if (!guildExists) {
            const createdGuild = await prisma.guild.create({
                data: {
                    rawId: guildId,
                    name: name,
                    userId: user.id, 
                    channelId: channelId,
                    channelName: channelName
                }
            });
            return createdGuild;
        } else {
            return guildExists;
        }
    } else {
        throw new Error("A user account is required before registering a guild.");
    }
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

export async function getAllGuilds(prisma: PrismaClient) {
    // This is expensive...
    const guilds = await prisma.user.findMany();
    return guilds;
}

export async function getAllGuildsWithMessages(prisma: PrismaClient, guildId: string) {
    const guild = await prisma.guild.findUnique({
        where: { rawId: guildId },
        include: {
            messages: true
        }
    });
    return guild;
}

export async function updateChannelInGuild(prisma: PrismaClient, guildId: string, channelName: string, channelId: string) {
    const guild = await prisma.guild.findUnique({
        where: { rawId: guildId }
    });

    if (guild) {
        const updatedGuild = await prisma.guild.update({
            where: {
                rawId: guildId
            },
            data: {
                channelId: channelId,
                channelName: channelName
            }
        });
        return updatedGuild;
    } else {
        throw Error("The guildId you entered is not valid.");
    }
}