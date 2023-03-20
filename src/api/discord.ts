import { ChannelType, Client } from "discord.js";
import { GuildResponse } from "../models/guild_response";
import { GuildRole } from "../models/guild_role";
import { GuildEmote } from "../models/guild_emote";
import { GuildChannel } from "../models/guild_channel";


export async function getAllRolesInGuild(client: Client, guildId: string): Promise<GuildRole[]> {
    const guild = await client.guilds.cache.get(guildId);
    if (guild) {
        const roles = guild.roles.cache;
        const guildRoles: GuildRole[] = [];
        roles.forEach(role => {
             guildRoles.push({
                id: role.id,
                name: role.name
             });
        });
        return guildRoles;
    } else {
        return [];
    }
}

export async function getAllGuildsOwnedByUser(client: Client, userId: string) {
    const guilds = await client.guilds.cache;
    const guildResponses: GuildResponse[] = [];
    guilds.filter(guild => guild.ownerId === userId).forEach(guild => {
        guildResponses.push({
            id: guild.id,
            ownerId: guild.ownerId,
            name: guild.name
        });
    });
    if (guilds) {
        return guildResponses;
    } else {
        return [];
    }
}

export async function getAllEmotesInGuild(client: Client, guildId: string): Promise<GuildEmote[]> {
    const guild = await client.guilds.cache.get(guildId);
    if (guild) {
        const emotes = guild.emojis.cache;
        const guildEmotes: GuildEmote[] = [];
        emotes.forEach(emote => {
            guildEmotes.push({
                id: emote.id,
                name: emote.name ?? '',
                image: emote.url
            });
        });
        return guildEmotes;
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

export async function getAllChannelsInGuild(client: Client, guildId: string): Promise<GuildChannel[]> {
    const guild = await client.guilds.fetch(guildId);
    if (guild) {
        // Only gather channels with the type of text
        const channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
        const guildChannels: GuildChannel[] = [];
        channels.forEach(channel => {
            guildChannels.push({
                id: channel.id,
                name: channel.name,
            });
        });
        return guildChannels;
    } else {
        return [];
    }
}