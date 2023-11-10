import { PrismaClient, User } from "@prisma/client";
import { ActivityType, Client, GatewayIntentBits, Message, PartialMessage, Partials } from 'discord.js';
import express from "express";
import session from "express-session";
import { handleAddReaction, handleRemoveMessage } from "./reaction/add_reaction";
import { handleRemoveReaction } from "./reaction/remove_reaction";
import { createRole, getAllChannelsInGuild, getAllEmotesInGuild, getAllGuildsOwnedByUser, getAllRolesInGuild } from "./api/discord";
import { generateException } from "./util/exception_handling";
import  cors  from "cors";
import { regenerateMessage } from "./message/generate_message";
import cron from "node-cron";

const environment = process.env.RAILWAY_ENVIRONMENT || "local";
const port = process.env.PORT || 3000;
const host = process.env.RAILWAY_STATIC_URL || "localhost";

import users from './routing/users';
import reactions from './routing/reactions';
import messages from './routing/messages';
import guilds from './routing/guilds';



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
app.use(cors());
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

app.use('/', users);
app.use('/', reactions);
app.use('/', messages);
app.use('/', guilds);

/**
 * Retrieve all Roles in a Guild
 */
app.get("/discord/roles", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const roles = await getAllRolesInGuild(client, guildId);
      res.json(roles);
    } else {
      res.status(400).send("This API requires: guildId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

/**
 * Retrieve all Guilds a user owns.
 */
app.get("/discord/guilds", async (req, res) => {
  try {
    if (req.query.userId) {
      const userId = String(req.query.userId);
      const guilds = await getAllGuildsOwnedByUser(prisma, client, userId);
      res.json(guilds);
    } else {
      res.status(400).send("This API requires: userId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

/**
 * Retrieves all Emojis from a Guild
 */
app.get("/discord/emotes", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const emotes = await getAllEmotesInGuild(client, guildId);
      res.json(emotes);
    } else {
      res.status(400).send("This API requires: guildId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.get("/discord/channels", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const channels = await getAllChannelsInGuild(client, guildId);
      res.json(channels);
    } else {
      res.status(400).send("This API requires: guildId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
})

/**
 * Create a role.
 */
app.post("/discord/role", async (req, res) => {
  try {
    if (req.body.roleName && req.body.guildId) {
      const roleName = String(req.body.roleName);
      const guildId = String(req.body.guildId);
      const role = await createRole(client, guildId, roleName);
      res.json(role);
    } else {
      res.status(400).send("This API requires: guildId, roleName");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Create a message given messageId, regenerate the message.
app.post("/message/regenerate", async (req, res) => {
  try {
    if (req.body.messageId) {
      const messageId = Number(req.body.messageId);
      await regenerateMessage(prisma, client, messageId);
      res.json("Generated/Regenerated message successfully!");
    } else {
      res.status(400).send("This API requires: messageId (non-raw)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.get("/discord/guilds/admin", async (req, res) => {
  try {
    if (req.query.userId) {
      const userId = String(req.query.userId);
      const guilds = await getAllGuildsOwnedByUser(prisma, client, userId);
      res.json(guilds);
    } else {
      res.status(400).send("This API requires: userId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});



// --- Discord Events ---
client.on('ready', async () => {
  console.log('Mounting Roach...!');
  console.log("Roach is ready to ride!");
  const discordCount = client.guilds.cache.size;
  client.user?.setPresence({
    status: 'online',
    activities: [{
      name: `${discordCount} discords!`,
      type: ActivityType.Watching
    }]
  });
  console.log(`Number of Discords: ${discordCount}`);
  app.listen(port, () => {
    console.log('Server is running on https://%s:%s', host, port);
  });
});

// When the user add a reaction, add the role.
client.on('messageReactionAdd', async (reaction, user) => {
  if (!user.bot)
    await handleAddReaction(prisma, client, reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (!user.bot)
    await handleRemoveReaction(prisma, client, reaction, user);
}); 


// When the user deletes a message, ensure it's not a message we care about.
// Otherwise, delete ALL reaction roles.
client.on('messageDelete', async (message: Message | PartialMessage) => {
  await handleRemoveMessage(prisma, message);
});

cron.schedule("30 3 * * *", () => {
  const user = client.users.cache.get("511334132115308545");

  if (user) {
    user.send("Good morning!");
  } else {
    console.error("User not found!");
  }
});

client.login(process.env.DISCORD_TOKEN);


/**
 * 
 * @returns The current environment given in the secret.
 */
export function getEnvironment() {
  return environment;
}

