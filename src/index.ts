import { PrismaClient, User } from "@prisma/client";
import { Client, GatewayIntentBits, Message, PartialMessage, Partials } from 'discord.js';
import express from "express";
import session from "express-session";
import { handleAddReaction, handleRemoveMessage } from "./reaction/add_reaction";
import { createUser, getUser } from "./api/users";
import { handleRemoveReaction } from "./reaction/remove_reaction";
import { createGuild, getGuild, getGuildsFromUser, updateChannelInGuild } from "./api/guilds";
import { createReaction, createReactions, getMessageReactionsInGuild, getReactionsInMessage, getReactionsInMessageById } from "./api/reactions";
import { createRole, getAllChannelsInGuild, getAllEmotesInGuild, getAllGuildsOwnedByUser, getAllRolesInGuild } from "./api/discord";
import { generateException } from "./util/exception_handling";
import  cors  from "cors";
import { addMessage, handleGuildMessages } from "./message/guild_messages";
import { regenerateMessage } from "./message/generate_message";
import { ReactionRequest } from "./models/reaction_request";

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

// Get specific user
app.get("/user/:id", async (req, res) => {
    try {
      if (req.params.id) {
        const userId = req.params.id;
        const user = await getUser(prisma, userId);
        res.json(user);
      } else {
        res.status(400).send("This API requires: id (userId)");
      }
    } catch (e: any) {
      generateException(res, e);
    }
});

// Create user
app.post("/user", async (req, res) => {
  try {
    if (req.body.rawId && req.body.name) {
      const user = await createUser(prisma, req.body.rawId, req.body.name);
      res.json(user);
    } else {
      res.status(400).send("Invalid rawId or undefined. Required: rawId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.get("/guild/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const guild = await getGuild(prisma, req.params.id.toString());
      res.json(guild);
    } else {
      res.status(400).send("This API requires: id (raw guild id)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.get("/user/guild/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const guilds = await getGuildsFromUser(prisma, req.params.id.toString());
      res.json(guilds);
    } else {
      res.status(400).send("This API requires: id (user's raw id)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

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

app.post("/guild", async (req, res) => {
  try {
    if (req.body.userId && req.body.guildId && req.body.guildName && req.body.channelName && req.body.channelId) {
      const userId = String(req.body.userId);
      const guildId = String(req.body.guildId);
      const guildName = String(req.body.guildName);
      const channelName = String(req.body.channelName);
      const channelId = String(req.body.channelId);
      const guild = await createGuild(prisma, userId, guildId, guildName, channelId, channelName);
      res.json(guild);
    } else {
      res.status(400).send("Request requires: guildId, userId, guildName");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.patch("/guild/channel", async (req, res) => {
  try {
    if (req.body.guildId && req.body.channelName && req.body.channelId) {
      const guildId = req.body.guildId;
      const channelName = req.body.channelName;
      const channelId = req.body.channelId;
      const updatedGuild = await updateChannelInGuild(prisma, guildId, channelName, channelId);
      res.json(updatedGuild);
    } else {
      res.status(400).send("This API requires: guildId, channelName, guildName");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

/**
 * Create a reaction via having a message id and 
 */
app.post("/reaction", async (req, res) => {
  try {
    if (req.body.guildId && req.body.messageId && req.body.roleId && req.body.roleName && req.body.emoteId) {
      const messageId = Number(req.body.messageId);
      const guildId = String(req.body.guildId);
      const roleId = String(req.body.roleId);
      const roleName = String(req.body.roleName);
      const emoteId = String(req.body.emoteId);

      const reaction = await createReaction(prisma, messageId, roleId, emoteId, guildId, roleName);
      res.json(reaction);
    } else {
      res.status(400).send("This request requires: guildId, messageId (non-raw), roleId, emoteId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

/**
 * You can create many reactions instead of just one.
 */
app.post("/reactions", async (req, res) => {
  try {
    if (req.body.guildId && req.body.messageId && req.body.reactions) {
      const reactions = req.body.reactions as ReactionRequest[];
      const guildId = String(req.body.guildId);
      const messageId = Number(req.body.messageId);
      
      const createdReactions = await createReactions(prisma, messageId, guildId, reactions);
      res.json(createdReactions);
    }
  } catch (e: any) {
    generateException(res, e);
  }
});


app.get("/reactions", async (req, res) => {
  try {
    if (req.query.messageId) {
      const messageId = String(req.query.messageId);
      const reactions = await getReactionsInMessage(prisma, messageId);
      res.json(reactions);
    } else {
      res.status(400).send("This request requires: messageId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

app.get("/reactions/by-id", async (req, res) => {
  try {
    if (req.query.messageId) {
      const messageId = Number(req.query.messageId);
      const reactions = await getReactionsInMessageById(prisma, messageId);
      res.json(reactions);
    } else {
      res.status(400).send("This request requires: messageId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Return all reactions by guild id.
app.get("/reactions/by-guild", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const reactions = await getMessageReactionsInGuild(prisma, guildId);
      res.json(reactions);
    } else {
      res.status(400).send("This request requires: guildId")
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Retrieve all messages of a guild.
app.get("/messages", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const messages = await handleGuildMessages(prisma, guildId);
      res.json(messages);
    } else {
      res.status(400).send("This API requires: guildId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Create a Message object. This does not create a physical message.
app.post("/message", async (req, res) => {
  try {
    if (req.body.guildId && req.body.subject) {
      const guildId = String(req.body.guildId);
      const subject = String(req.body.subject);

      const createdMessage = await addMessage(prisma, guildId, subject);
      res.json(createdMessage);
    } else {
      res.status(400).send("This API requires: guildId, subject");
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
      res.send("Generated/Regenerated message successfully!");
    } else {
      res.status(400).send("This API requires: messageId (non-raw)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});


// --- Discord Events ---
client.on('ready', async () => {
  console.log('Mounting Roach...!');
  console.log("Roach is ready to ride!");
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

client.login(process.env.DISCORD_TOKEN);


/**
 * 
 * @returns The current environment given in the secret.
 */
export function getEnvironment() {
  return environment;
}

