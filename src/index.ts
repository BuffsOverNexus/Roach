import { PrismaClient } from "@prisma/client";
import { Client, Message } from 'discord.js';
import express from "express";
const prisma = new PrismaClient();
const client = new Client({ intents: [] });

require("dotenv").config();


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

app.get("/users", async(req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(users);
});

app.get("/user/:id", async(req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id }
    });
  
    res.json(user);
  } catch {
    res.status(400).send("Invalid type.");
  }
});

app.post("/oauth", async(req, res) => {

});

client.on('ready', () => {
  console.log('Discord bot is ready.');
  app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
  });
});

client.on('message', (message) => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});

client.login();