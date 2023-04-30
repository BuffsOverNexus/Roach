import { PrismaClient } from "@prisma/client";


export async function getMessage(prisma: PrismaClient, messageId: string) {
    const message = await prisma.message.findUnique({
        where: {
            rawId: messageId
        }
    });

    return message;
}

export async function getMessageById(prisma: PrismaClient, id: number) {
    const message = await prisma.message.findUnique({
        where: {
            id: id
        }
    });
    return message;
}