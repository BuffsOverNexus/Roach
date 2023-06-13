import { PrismaClient } from "@prisma/client";
import { getGuild } from "../api/guilds";


export async function handleGuildMessages(prisma: PrismaClient, guildId: string) {
    try {
        const savedGuild = await prisma.guild.findUnique({
            where: { rawId: guildId },
            include: {
                messages: true
            }
        });
        
        if (savedGuild) {
            return savedGuild.messages;
        }

        // Empty array - Doesn't exist.
        return [];
    } catch (e: any) {
        console.log(e);
    }
}

export async function addMessage(prisma: PrismaClient, guildId: string, subject: string) {
    const guild = await getGuild(prisma, guildId);
    // First, determine if the message already exists.
    if (guild) {
        const existingMessage = await prisma.message.findFirst({
            where: {
                subject: subject,
                guildId: guild.id
            }
        });

        if (existingMessage) {
            return existingMessage;
        } else {
            const createdMessage = await prisma.message.create({
                data: {
                    subject: subject,
                    guildId: guild.id
                }
            });

            return createdMessage;
        }
    } else {
        throw new Error("Invalid guildId was entered when creating message: " + guildId);
    }
    
}