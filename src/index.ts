import { PrismaClient, User } from "@prisma/client";
import { ActivityType, Client, Events, GatewayIntentBits, Message, PartialMessage, Partials, SlashCommandBuilder } from 'discord.js';
import express from "express";
import session from "express-session";
import { handleAddReaction, handleRemoveMessage } from "./reaction/add_reaction";
import { handleRemoveReaction } from "./reaction/remove_reaction";
import { createRole, getAllChannelsInGuild, getAllEmotesInGuild, getAllGuildsOwnedByUser, getAllRolesInGuild } from "./api/discord";
import { generateException } from "./util/exception_handling";
import  cors  from "cors";
import { regenerateMessage } from "./message/generate_message";
import cron from "node-cron";
import * as birthdayCommand from './commands/birthday';

const environment = process.env.RAILWAY_ENVIRONMENT || "local";
const port = process.env.PORT || 3000;
const host = process.env.RAILWAY_STATIC_URL || "localhost";

import users from './routing/users';
import reactions from './routing/reactions';
import messages from './routing/messages';
import guilds from './routing/guilds';
import birthdays from './routing/birthdays';



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
// Configure CORS to only allow specific origins and support credentials (cookies)
const allowedOrigins = [
  // Add your production/frontend origin here
  'https://roach.buffsovernexus.com',
  // Common local dev origins - adjust port if needed
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests like Postman (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// If running behind a proxy (e.g. Railway/Heroku), enable trust proxy so secure cookies work
if (environment !== 'local') {
  app.set('trust proxy', 1);
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

// Session
app.use(
  session({
    secret: 'dbeavertypescriptjava',
    resave: false,
    saveUninitialized: true,
    cookie: {
      // secure must be true for SameSite=None cookies; enable in non-local environments
      secure: environment !== 'local',
      // local dev: keep lax to avoid cross-site blocking; production: use 'none' so cross-site cookies work with credentials
      sameSite: environment === 'local' ? 'lax' : 'none'
    }
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
app.use('/', birthdays);

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
client.once(Events.ClientReady, async () => {
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
  // Register slash command(s) on startup. This registers a global command — consider
  // switching to guild-specific registration during development for faster updates.
  try {
    if (client.application) {
      await client.application.commands.create(birthdayCommand.data as any);
      console.log('Registered /birthday command');
    }
  } catch (e: any) {
    console.error('Failed to register slash commands:', e?.message ?? e);
  }
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
client.on(Events.MessageDelete, async (message: Message | PartialMessage) => {
  await handleRemoveMessage(prisma, message);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'birthday') {
      await birthdayCommand.execute(interaction);
    }
  } catch (e: any) {
    console.error('Error while handling interaction:', e);
    if (interaction.isRepliable()) {
      try { await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true }); } catch {};
    }
  }
});



// Send Kooper a good morning every morning at 3:30am
// cron.schedule("0 7 * * *", () => {
//   const user = client.users.cache.get("511334132115308545");

//   if (user) {
//     user.send("Good morning!");
//   } else {
//     console.error("User not found!");
//   }
// });

client.login(process.env.DISCORD_TOKEN);


/**
 * 
 * @returns The current environment given in the secret.
 */
export function getEnvironment() {
  return environment;
}

