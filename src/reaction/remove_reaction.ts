import { PrismaClient } from "@prisma/client";
import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";


export async function handleRemoveReaction(prisma: PrismaClient, client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    const messageId = reaction.message.id;
    const userId = user.id;

    if (!reaction.emoji.id && !reaction.emoji.name)
        reaction = await reaction.fetch();

    if (reaction.message.id && reaction.message.guildId) {
        const guildRawId = reaction.message.guildId;
        // Determine if its an ID or Name
        if (reaction.emoji.id) {
            const emoteId = reaction.emoji.id;
            removeCustomEmote(prisma, client, emoteId, messageId, guildRawId, userId);
        } else {
            console.error("Error: emojiId is not present.");
        }
    } else {
        console.error("Reaction does not have message or id.");
    }
}

async function removeCustomEmote(prisma: PrismaClient, client: Client, emoteId: string, messageId: string, guildRawId: string, userId: string) {
    // Gather the emote if it exists
    const savedReaction = await prisma.reaction.findFirst({
        where: {
            message: {
                rawId: messageId,
                guild: {
                    rawId: guildRawId
                }
            },
            emoteId: emoteId
        }
    });

    if (savedReaction) {
        // Gather the role id
        await removeRole(client, savedReaction.roleId.toString(), guildRawId, userId);
    } else {
        console.log("Custom Emote (message, emoteId, raw_guild) does not exist: (%s, %s, %s)", messageId, emoteId, guildRawId);
    }
}

async function removeRole(client: Client, roleId: string, guildRawId: string, userId: string) {
    const guild = client.guilds.cache.get(guildRawId);
    if (guild) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
            const member = guild.members.cache.get(userId);
            if (member) {
                member.roles.remove(role);
            } else {
                console.error("The (userId, guildId) combination does not exist: (%s, %s)", userId, guildRawId);
            }
        } else {
            console.error("The (roleId, guildId) combination does not exist: (%s, %s)", roleId, guildRawId);
        }
    } else {
        console.error("The guildId does not have Roach: %s", guildRawId);
    }
}