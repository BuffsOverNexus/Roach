import { PrismaClient } from "@prisma/client";
import { getGuild } from "./guilds";



export async function createReactionFromEmoteId(prisma: PrismaClient, messageId: string, roleId: string, guildId: string, emoteId: string) {
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
                    emoteId: emoteId
                }
            });
            return createdReaction;
        }
    } else {
        return null;
    }
}

export async function createReactionFromEmoteName(prisma: PrismaClient, messageId: string, roleId: string, guildId: string, emoteName: string) {
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
                    emoteName: emoteName
                }
            });

            return createdReaction;
        }
    } else {
        return null;
    }  
}