import { PrismaClient } from "@prisma/client";
import { Client, GatewayIntentBits, Message, PartialMessage, Partials } from 'discord.js';
import express from "express";
import session from "express-session";
import { handleAddReaction, handleRemoveMessage } from "./reaction/add_reaction";
import { createUser, getUser } from "./api/users";
import { handleRemoveReaction } from "./reaction/remove_reaction";
import { createGuild, getGuild, getGuildsFromUser } from "./api/guilds";
import { createReactionFromEmoteId, getReactionsInGuild } from "./api/reactions";
import { createRole, getAllChannelsInGuild, getAllEmotesInGuild, getAllGuildsOwnedByUser, getAllRolesInGuild } from "./api/discord";
import { handleMessage } from "./message/handle_message";
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
    if (req.params.id) {
      const guild = await getGuild(prisma, req.params.id.toString());
      res.json(guild);
    } else {
      res.status(400).send("This API requires: id (raw guild id)");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("Invalid type given for guild id");
  }
});

app.get("/user/guild/:id", async (req, res) => {
  try {
    if (req.params.id) {
      const guilds = await getGuildsFromUser(prisma, req.params.id.toString());
      res.json(guilds);
    } else {
      res.status(400).send("");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred when retrieving user guilds.");
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
      const guild = await createGuild(prisma, userId, guildId, guildName, channelName, channelId);
      res.json(guild);
    } else {
      res.status(400).send("Request requires: guildId, userId, guildName");
    }
  } catch {
    res.status(500).send("An error occurred when creating a guild.");
  }
});

app.post("/reaction", async (req, res) => {
  try {
    if (req.body.guildId && req.body.messageId && req.body.roleId && req.body.roleName) {
      const messageId = String(req.body.messageId);
      const guildId = String(req.body.guildId);
      const roleId = String(req.body.roleId);
      const roleName = String(req.body.roleName);

      if (req.body.emoteId) {
        const emoteId = String(req.body.emoteId);
        const reaction = await createReactionFromEmoteId(prisma, messageId, roleId, guildId, emoteId, roleName);
        res.json(reaction);
      } else {
        res.status(400).send("This request requires: emoteId");
      }
    } else {
      res.status(400).send("This request requires: guildId, messageId, roleId, (emoteName or emoteId)");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
  }
});

app.get("/reaction", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const reactions = await getReactionsInGuild(prisma, guildId);
      res.json(reactions);
    } else {
      res.status(400).send("This request requires: guildId");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
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
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
  }
});

/**
 * Retrieve all Guilds a user owns.
 */
app.get("/discord/guilds", async (req, res) => {
  try {
    if (req.query.userId) {
      const userId = String(req.query.userId);
      const guilds = await getAllGuildsOwnedByUser(client, userId);
      res.json(guilds);
    } else {
      res.status(400).send("This API requires: userId");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
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
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
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
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
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
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
  }
});

app.post("/message", async (req, res) => {
  // Create a message in the designated <channel> and update all reactions.
  // Sent: channel (id, name), reactions (emoteId, roleId, guildId)
  try {
    // Check for the channel information
    if (req.body.channelId && req.body.guildId) {
      // Check for the reaction information
      if (req.body.reactions) {
        // Gather all reactions
        const reactions = req.body.reactions;
        const guildId = String(req.body.guildId);
        const channelId = String(req.body.channelId);
        const result = await handleMessage(prisma, client, channelId, guildId, reactions);
        res.json(result);
      } else {
        res.status(400).send("This API requires: reactions (emoteId, roleId)");
      }
    } else {
      res.status(400).send("This API requires: channelId, guildId");
    }
  } catch (e: any) {
    console.log(e);
    res.status(500).send("An error has occurred. Contact the Roach team.");
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