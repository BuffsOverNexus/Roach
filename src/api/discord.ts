import { ChannelType, Client } from "discord.js";


export async function getAllRolesInGuild(client: Client, guildId: string) {
    const guild = await client.guilds.cache.get(guildId);
    if (guild) {
        return guild.roles.cache;
    } else {
        return [];
    }
}

export async function getAllGuildsOwnedByUser(client: Client, userId: string) {
    const guilds = await client.guilds.cache;
    if (guilds) {
        return guilds.filter(guild => guild.ownerId === userId);
    } else {
        return [];
    }
}

export async function getAllEmotesInGuild(client: Client, guildId: string) {
    const guild = await client.guilds.cache.get(guildId);
    if (guild) {
        return guild.emojis.cache;
    } else {
        return [];
    }
}

export async function createRole(client: Client, guildId: string, roleName: string) {
    const guild = await client.guilds.fetch(guildId);
    if (guild) {
        const role = await guild.roles.create({
            name: roleName
        });
        return role;
    } else {
        return null;
    }
}

export async function getAllChannelsInGuild(client: Client, guildId: string) {
    const guild = await client.guilds.fetch(guildId);
    if (guild) {
        // Only gather channels with the type of text
        const channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
        return channels;
    } else {
        return null;
    }
}