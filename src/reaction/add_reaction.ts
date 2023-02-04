import { PrismaClient } from "@prisma/client";
import { MessageReaction, PartialMessageReaction, User, PartialUser, Client } from "discord.js";
import { getEnvironment } from "..";

/**
 * Handle Add Reaction
 * @param reaction -> The reaction (emote, message, guild)
 * @param user -> The user who reacted
 */
export async function handleAddReaction(prisma: PrismaClient, client: Client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    const messageId = reaction.message.id;
    const userId = user.id;

    // Ensure id or name is populated, otherwise force populate.
    if (!reaction.emoji.id && !reaction.emoji.name)
        reaction = await reaction.fetch();

    if (reaction.message.id && reaction.message.guildId) {
        const guildRawId = reaction.message.guildId;
        // Determine if its an ID or Name
        if (reaction.emoji.id) {
            const emoteId = reaction.emoji.id;
            handleCustomEmote(prisma, client, emoteId, messageId, guildRawId, userId);
        } else if (reaction.emoji.name) {
            const emoteName = reaction.emoji.name;
            handleStandardEmote(prisma, client, emoteName, messageId, guildRawId, userId);
        } else {
            console.error("Neither emoji id or name is present.");
        }
    }
      
}

async function handleCustomEmote(prisma: PrismaClient, client: Client, emoteId: string, messageId: string, guildRawId: string, userId: string) {
    // Gather the emote if it exists
    const savedReaction = await prisma.reaction.findFirst({
        where: {
            messageId: messageId,
            emoteId: emoteId,
            guild: { 
                rawId: guildRawId
            }
        }
    });

    if (savedReaction) {
        // Gather the role id
        await addRole(client, savedReaction.roleId.toString(), guildRawId, userId);
    } else {
        if (getEnvironment() != "production")
            console.log("Custom Emote (message, emoteId, raw_guild) does not exist: (%s, %s, %s)", messageId, emoteId, guildRawId);
    }
}

async function handleStandardEmote(prisma: PrismaClient, client: Client, emoteName: string, messageId: string, guildRawId: string, userId: string) {
    // Gather the emote if it exists
    const savedReaction = await prisma.reaction.findFirst({
        where: {
            messageId: messageId,
            emoteName: emoteName as string,
            guild: { rawId: guildRawId }
        }
    });

    if (savedReaction) {
        // Gather the role id
        addRole(client, savedReaction.roleId.toString(), guildRawId, userId);
    } else {
        if (getEnvironment() != "production")
            console.log("Generic Emote (message, emoteName, raw_guild) does not exist: (%s, %s, %s)", messageId, emoteName, guildRawId);
    }
}

async function addRole(client: Client, roleId: string, guildRawId: string, userId: string) {
    const guild = client.guilds.cache.get(guildRawId);
    if (guild) {
        const role = guild.roles.cache.get(roleId);
        if (role) {
            const member = guild.members.cache.get(userId);
            if (member) {
                member.roles.add(role);
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

