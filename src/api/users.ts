import { PrismaClient } from "@prisma/client";


export async function createUser(prisma: PrismaClient, userId: string, name: string) {
    // Check if user exists
    const existingUser = await getUser(prisma, userId);
    if (!existingUser) {
        const createdUser = await prisma.user.create({
            data: {
                rawId: userId,
                name: name
            }
        });
        return createdUser;
    }
    return existingUser;
}

export async function getAllUsers(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" }
      });
    return users;
}

export async function getUser(prisma: PrismaClient, userId: string) {
    const user = await prisma.user.findUnique({
        where: { rawId: userId }
    });
    return user;
}