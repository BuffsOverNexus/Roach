import { Prisma, PrismaClient, Reaction } from "@prisma/client";
import { getGuild } from "./guilds";
import { getMessageById } from "./messages";
import { ReactionRequest } from "../models/reaction_request";


export async function createReaction(prisma: PrismaClient, messageId: number, roleId: string, emoteId: string, guildId: string, roleName: string) {
    // Determine if the guild exists.
    const guild = await getGuild(prisma, guildId);
    const message = await getMessageById(prisma, messageId);

    if (!guild) {
        throw new Error("Invalid raw guild identifier.");
    }

    if (!message) {
        throw new Error("Invalid non-raw message id.");
    }

    // Attempt to find the existing reactions.
    const existingReaction = await prisma.reaction.findFirst({
        where: {
            roleId: roleId,
            emoteId: emoteId,
        }
    });

    if (!existingReaction) {
        // Create a new reaction.
        const createdReaction = await prisma.reaction.create({
            data: {
                emoteId: emoteId,
                roleName: roleName,
                roleId: roleId,
                messageId: message.id
            }
        });

        return createdReaction;
    } else {
        return existingReaction;
    }

}

export async function createReactions(prisma: PrismaClient, messageId: number, guildId: string, reactions: ReactionRequest[]) {
    // Find the guild.
    const guild = await getGuild(prisma, guildId);

    if (guild) {
        // Find the message (non-raw)
        const message = await getMessageById(prisma, messageId);

        if (message) {
            const createdReactions: Reaction[] = [];

            // Create the reactions
              reactions.forEach(async reaction => {
                // Determine if it already exists.
                const existingReaction = await prisma.reaction.findFirst({
                    where: {
                        message: {
                            id: messageId,
                            guild: {
                                rawId: guildId
                            }
                        },
                        roleId: reaction.roleId,
                        emoteId: reaction.emoteId
                    }
                });

                if (!existingReaction) {
                    const createdReaction = await prisma.reaction.create({
                        data: {
                            roleId: reaction.roleId,
                            messageId: message.id,
                            roleName: reaction.roleName,
                            emoteId: reaction.emoteId
                        }
                    });

                    createdReactions.push(createdReaction);
                } else {
                    createdReactions.push(existingReaction);
                }
            });

            return createdReactions;
        } else {
            throw new Error("You are attempting to add reactions to an invalid message.");
        }

    } else {
        throw new Error("You are attempting to add reactions to an invalid guild: " + guildId);
    }
}

export async function getReactionsInMessage(prisma: PrismaClient, messageId: string) {
    // Check if message exists
    const message = await prisma.message.findUnique({ 
        where: { rawId: messageId },
        include: {
            reactions: true
        }
    });

    if (message) {
        return message.reactions;
    } else {
        return [];
    }
}

export async function getReactionsInMessageById(prisma: PrismaClient, messageId: number) {
    const message = await prisma.message.findUnique({
        where: {
            id: messageId
        },
        include: {
            reactions: true
        }
    });

    if (message) {
        return message.reactions;
    } else {
        return [];
    }
}

export async function getMessageReactionsInGuild(prisma: PrismaClient, guildId: string) {
    // Check if the guild exists.
    const guild = await prisma.guild.findUnique({ 
        where: {
            rawId: guildId
        },
        include: {
            messages: {
                select: {
                    reactions: true
                }
            }
        }
    });

    if (guild) {
        return guild.messages;
    } else {
        return [];
    }
}

export async function deleteReaction(prisma: PrismaClient, reactionId: number) {
    const existingReaction = await prisma.reaction.findUnique({
        where: {
            id: reactionId
        }
    });

    if (existingReaction) {
        const result = await prisma.reaction.delete({
            where: {
                id: reactionId
            }
        });
        return result;
    } else {
        throw new Error(`The reaction with id, ${reactionId}, does not exist.`);
    }
}