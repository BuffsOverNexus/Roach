import { PrismaClient } from "@prisma/client";
import { getGuild } from "./guilds";



export async function createReactionFromEmoteId(prisma: PrismaClient, messageId: string, roleId: string, guildId: string, emoteId: string, roleName: string) {
    // Check if guild exists
    const guild = await getGuild(prisma, guildId);

    if (guild) {
        // Check if reaction exists
        const existingReaction = await prisma.reaction.findFirst({
            where: {
                messageId: messageId,
                roleId: roleId,
                guild: {
                    id: guild.id
                },
                emoteId: emoteId
            }
        });

        if (existingReaction) {
            return existingReaction;
        } else {
            // Reaction doesn't exist. Create it and return it.
            const createdReaction = await prisma.reaction.create({
                data: {
                    messageId: messageId,
                    roleId: roleId,
                    guildId: guild.id,
                    roleName: roleName
                    emoteId: emoteId
                }
            });
            return createdReaction;
        }
    } else {
        return null;
    }
}

export async function createReactionFromEmoteName(prisma: PrismaClient, messageId: string, roleId: string, guildId: string, emoteName: string, roleName: roleName) {
    // Check if guild exists
    const guild = await getGuild(prisma, guildId);

    if (guild) {
        // Check if reaction exists
        const existingReaction = await prisma.reaction.findFirst({
            where: {
                messageId: messageId,
                roleId: roleId,
                guild: {
                    id: guild.id
                },
                emoteName: emoteName
            }
        });

        if (existingReaction) {
            return existingReaction;
        } else {
            const createdReaction = await prisma.reaction.create({ 
                data: {
                    messageId: messageId,
                    roleId: roleId,
                    guildId: guild.id,
                    roleName: roleName,
                    emoteName: emoteName
                }
            });

            return createdReaction;
        }
    } else {
        return null;
    }  
}

export async function getReactionsInGuild(prisma: PrismaClient, rawId: string) {
    // Check if guild exists
    const guild = await prisma.guild.findUnique({ 
        where: { rawId },
        include: {
            reactions: true
        }
    });

    if (guild) {
        return guild.reactions;
    } else {
        return [];
    }
}