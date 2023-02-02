import { Client, Message } from 'discord.js';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const client = new Client({ intents: [] });

client.on('ready', () => {
  console.log('Discord bot is ready.');
});

client.on('message', (message: Message) => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});


client.login(process.env.BOT_TOKEN);