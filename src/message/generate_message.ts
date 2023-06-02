import { Message, PrismaClient, Reaction } from "@prisma/client";
import { Client, TextChannel, EmbedBuilder, Guild } from "discord.js";

/**
 * 
 * @param prisma - The Prisma client to connect to the database
 * @param client - The Discord client to perform Discord commands.
 * @param messageId - The database message id to use against the database to retrieve information.
 */
export async function regenerateMessage(prisma: PrismaClient, client: Client, messageId: number) {
    // First, determine if the message exists.
    const savedMessage = await prisma.message.findUnique({
        where: {
            id: messageId
        },
        include: {
            reactions: true,
            guild: true
        }
    });

    if (savedMessage) {
        const guild = client.guilds.cache.get(savedMessage.guild.rawId);        
        if (guild) {
            // Determine if the message still exists in the guild.
            const channel = guild.channels.cache.get(savedMessage.guild.channelId);
        
            if (channel instanceof TextChannel) {
                // Get all saved messages
                const savedMessages = await prisma.message.findMany({
                    where: {
                        guildId: savedMessage.guild.id
                    }
                });
                const allMessages = await channel.messages.fetch();
                
                allMessages.forEach(message => {
                    const exists = savedMessages.filter(savedMessage => savedMessage.rawId == message.id).length != 0;
                    if (!exists) {
                        message.delete();
                    }
                })

                const contents = getMessageContents(guild, savedMessage);
                // Determine if the message exists...
                if (savedMessage.rawId) {
                    // Now delete the message
                    const message = await channel.messages.fetch(savedMessage.rawId);
                    if (message) {
                        // Message exists. Just update it.
                        await message.edit({ embeds: [contents] });
                        await message.reactions.removeAll();
                        savedMessage.reactions.forEach(async reaction => {
                            await message.react(reaction.emoteId);
                        });
                    } else {
                        // Generating new message.
                        const addedMessage = await channel.send({ embeds: [contents]});
                        // Update database with message id.
                        await prisma.message.update({
                            where: {
                                id: messageId
                            },
                            data: {
                                rawId: addedMessage.id
                            }
                        });

                        await addedMessage.reactions.removeAll();
                        savedMessage.reactions.forEach(async reaction => {
                            await addedMessage.react(reaction.emoteId);
                        });
                    }
                } else {
                    const addedMessage = await channel.send({ embeds: [contents]} );
                    await prisma.message.update({
                        where: {
                            id: messageId
                        },
                        data: {
                            rawId: addedMessage.id
                        }
                    });

                    await addedMessage.reactions.removeAll();
                    savedMessage.reactions.forEach(async reaction => {
                        await addedMessage.react(reaction.emoteId);
                    });
                }
            } else {
                throw new Error("The message was not generated because the channel is not a text channel.");
            }
        } else {
            throw new Error("The message was not generated because the guild was not found.");
        }
    
    } else {
        throw new Error("The message was not found in the database and therefore we cannot regenerate this message.");
    }
}

function getMessageContents(guild: Guild, message: Message & {reactions: Reaction[]; guild: Guild;}) {
    // Populate all of the fields
    const fields: any = [];
    const reactions: Reaction[] = message.reactions;

    if (reactions.length > 0) {
        // Generate the contents.
        reactions.forEach(reaction => {
            const role = guild.roles.cache.get(reaction.roleId);
            const emote = guild.emojis.cache.get(reaction.emoteId);
            if (role && emote) {
                const emoteName = emote.name;
                fields.push({ value: `<:${emoteName}:${reaction.emoteId}> <@&${role.id}>` });
            }
        });

        // Create the message contents
        const contents = new EmbedBuilder()
        .setTitle(message.subject)
        .setDescription("**+** React to this message to receive a role. \n**-** Remove the reaction to take away the role.")
        .setFooter({ text: "Powered by Roach" })
        .addFields(fields);

        return contents;
    } else {
        // Create the message contents
        const contents = new EmbedBuilder()
        .setTitle("Invalid Setup")
        .setDescription("You need to visit http://roach.buffsovernexus.com and create roles to react to!")
        .setFooter({ text: "Powered by Roach" });
        return contents;
    }
}