import { PrismaClient } from "@prisma/client";
import { Client, Message, GatewayIntentBits, Partials } from 'discord.js';
import express from "express";
import session from "express-session";
import { send } from "process";
import querystring from 'querystring';
import { handleAddReaction } from "./reaction/add_reaction";
import { createUser, getAllUsers, getUser } from "./api/users";
import { handleRemoveReaction } from "./reaction/remove_reaction";
import { createGuild, getGuild, getGuildsFromUser } from "./api/guilds";
import { createReactionFromEmoteId, createReactionFromEmoteName } from "./api/reactions";

const environment = process.env.RAILWAY_ENVIRONMENT || "local";
const port = process.env.PORT || 3000;
const host = process.env.RAILWAY_STATIC_URL || "localhost";


if (environment == "local")
  require("dotenv").config();

// Prisma Client
const prisma = new PrismaClient();

// Discord Client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
  partials: [
    Partials.Message, 
    Partials.Channel, 
    Partials.Reaction
  ]
});

// Express app
const app = express().disable("x-powered-by");


// Express setup
app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

// Session
app.use(
  session({
    secret: 'dbeavertypescriptjava',
    resave: false,
    saveUninitialized: true
  })
);

console.log("Environment: %s", environment);

// Only need this if it is local
if (environment == "local")
  require("dotenv").config();

// Debugging
console.log("Port: %s", port);
console.log("Token: %s", process.env.DISCORD_TOKEN);

// Get specific user
app.get("/user/:id", async (req, res) => {
    try {
      console.log(typeof req.params.id);
      const user = await getUser(prisma, req.params.id.toString());
      res.json(user);
    } catch (e: any) {
      console.error(e);
      res.status(400).send("Invalid type given for userId.");
    }
});


// Create user
app.post("/user", async (req, res) => {
  try {
    if (req.body.rawId) {
      const user = await createUser(prisma, req.body.rawId, req.body.name);
      res.json(user);
    } else {
      res.status(400).send("Invalid rawId or undefined. Required: rawId");
    }
  } catch (e: any) {
    console.error(e);
    res.status(500).send("An error has occurred when creating a user.");
  }
});

app.get("/guild/:id", async (req, res) => {
  try {
    const guild = await getGuild(prisma, req.params.id.toString());
    res.json(guild);
  } catch {
    res.status(400).send("Invalid type given for guild id");
  }
});

app.get("/user/guild/:id", async (req, res) => {
  try {
    const guilds = await getGuildsFromUser(prisma, req.params.id.toString());
    res.json(guilds);
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred when retrieving user guilds.");
  }
});

app.post("/guild", async (req, res) => {
  try {
    if (req.body.userId && req.body.guildId && req.body.guildName) {
      const userId = String(req.body.userId);
      const guildId = String(req.body.guildId);
      const guildName = String(req.body.guildName);
      const guild = await createGuild(prisma, userId, guildId, guildName);
      res.json(guild);
    } else {
      res.status(400).send("Request requires: guildId, userId, guildName");
    }
  } catch {
    res.status(500).send("An error occurred when creating a guild.");
  }
});

app.post("/reaction", async (req, res) => {
  if (req.body.guildId && req.body.messageId && req.body.roleId) {
    const messageId = String(req.body.messageId);
    const guildId = String(req.body.guildId);
    const roleId = String(req.body.roleId);
    if (req.body.emoteName) {
      const emoteName = String(req.body.emoteName);
      const reaction = await createReactionFromEmoteName(prisma, messageId, roleId, guildId, emoteName);
      res.json(reaction);
    } else if (req.body.emoteId) {
      const emoteId = String(req.body.emoteId);
      const reaction = await createReactionFromEmoteId(prisma, messageId, roleId, guildId, emoteId);
      res.json(reaction);
    } else {
      res.status(400).send("This request requires: emoteName or emoteId");
    }
  } else {
    res.status(400).send("This request requires: guildId, messageId, roleId, (emoteName or emoteId)");
  }
});

// --- Discord Events ---
client.on('ready', () => {
  console.log('Roach is ready to ride!');
  app.listen(port, () => {
    console.log('Server is running on http://%s:%s', host, port);
  });
});

// When the user add a reaction, add the role.
client.on('messageReactionAdd', async (reaction, user) => {
  await handleAddReaction(prisma, client, reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
  await handleRemoveReaction(prisma, client, reaction, user);
}); 

client.login(process.env.DISCORD_TOKEN);

export function getEnvironment() {
  return environment;
}