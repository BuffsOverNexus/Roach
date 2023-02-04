import { PrismaClient } from "@prisma/client";
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { createGuild } from "../api/guilds";
import { createReactionFromEmoteId } from "../api/reactions";
import { ReactionRequest } from "../models/reaction_request";


export async function createMessage(prisma: PrismaClient, client: Client, channelId: string, guildId: string, reactions: ReactionRequest[]) {
    // Firstly, acquire the guild.
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
            if (channel instanceof TextChannel) {
                // Determine if the guild is saved in the database
                const savedGuild = await prisma.guild.findUnique({
                    where: { rawId: guildId }
                });

                if (savedGuild) {
                    // Populate all of the fields
                    const fields: any = [];
                    reactions.forEach(reaction => {
                        const role = guild.roles.cache.get(reaction.roleId);
                        const emote = guild.emojis.cache.get(reaction.emoteId);
                        if (role && emote) {
                            const emoteName = emote.name;
                            fields.push({ name: `${role.name} (<:${emoteName}:${reaction.emoteId}>)`, value: `<@&${role.id}>` });
                        }
                    });

                    // Create the message
                    const contents = new EmbedBuilder()
                    .setTitle("Select Your Roles")
                    .setDescription("+ React to this message to receive a role. \n- Remove the reaction to take away the role.")
                    .setFooter({ text: "Powered by Roach" })
                    .addFields(fields);

                    // Create the message
                    const message = await channel.send({ embeds: [contents] });

                    // Create the reactions and save them into database.
                    reactions.forEach(async reaction => {
                        const role = guild.roles.cache.get(reaction.roleId);
                        if (role) {
                            await message.react(reaction.emoteId);
                            // Save to the database
                            await createReactionFromEmoteId(prisma, message.id, reaction.roleId, guildId, reaction.emoteId, role.name);
                        }
                    });

                    // Update the database with the correct messageId
                    
                    return true;
                }
            }
        }
    }
    return false;
}