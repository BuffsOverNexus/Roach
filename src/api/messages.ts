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

export async function deleteMessage(prisma: PrismaClient, messageId: number) {
    const existingMessage = await prisma.message.findUnique({
        where: {
            id: messageId
        }
    });

    if (!existingMessage) {
        return false;
    }

    const deleteReactions = await prisma.reaction.deleteMany({
        where: {
            messageId: messageId
        }
    });

    // Delete message and all reactions associated
    const result = await prisma.message.delete({
        where: {
            id: messageId
        }
    });

    if (!result) {
        return false;
    }

    return true;
}

export async function updateMessage(prisma: PrismaClient, messageId: number, subject: string) {
    const existingMessage = await prisma.message.findUnique({
        where: {
            id: messageId
        }
    });

    if (!existingMessage) {
        return false;
    }

    const result = await prisma.message.update({
        where: {
            id: messageId
        },
        data: {
            subject: subject
        }
    });

    if (!result) {
        return false;
    }

    return true;
}
