import { PrismaClient } from "@prisma/client";
import { Client, TextChannel, EmbedBuilder, Guild } from "discord.js";
import { createGuild } from "../api/guilds";
import { createReactionFromEmoteId } from "../api/reactions";
import { ReactionRequest } from "../models/reaction_request";


export async function handleMessage(prisma: PrismaClient, client: Client, channelId: string, guildId: string, reactions: ReactionRequest[]) {
    // Firstly, acquire the guild.
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
            if (channel instanceof TextChannel) {
                // Determine if the guild is saved in the database
                const savedGuild = await prisma.guild.findUnique({
                    where: { rawId: guildId },
                    include: {
                        reactions: true
                    }
                });

                if (savedGuild) {
                    // Delete all messages from Roach given the channel.
                    const existingMessagesInChannel = await channel.messages.fetch();
                    existingMessagesInChannel.forEach(async existingMessage => {
                        if (existingMessage.author.id === client.user?.id) {
                            await existingMessage.delete();
                        }
                    });

                    // Gather contents to display in the message.
                    const contents = getMessageContents(guild, reactions);
                    // Create the message.
                    const message = await channel.send({ embeds: [contents] });

                    // Create the reactions and save them into database.
                    reactions.forEach(async reaction => {
                        const role = guild.roles.cache.get(reaction.roleId);
                        if (role) {
                            // React to the message.
                            await message.react(reaction.emoteId);
                            // Save to the database if it doesn't already exist.
                            await createReactionFromEmoteId(prisma, message.id, reaction.roleId, guildId, reaction.emoteId, role.name);
                        }
                    });
                    return true;
                }
            }
        }
    }
    return false;
}

function getMessageContents(guild: Guild, reactions: ReactionRequest[]) {
    // Populate all of the fields
    const fields: any = [];
    reactions.forEach(reaction => {
        const role = guild.roles.cache.get(reaction.roleId);
        const emote = guild.emojis.cache.get(reaction.emoteId);
        if (role && emote) {
            const emoteName = emote.name;
            fields.push({ name: ``, value: `<:${emoteName}:${reaction.emoteId}> <@&${role.id}>` });
        }
    });

    // Create the message contents
    const contents = new EmbedBuilder()
    .setTitle("Select Your Roles")
    .setDescription("**+** React to this message to receive a role. \n**-** Remove the reaction to take away the role.")
    .setFooter({ text: "Powered by Roach" })
    .addFields(fields);

    return contents;
}