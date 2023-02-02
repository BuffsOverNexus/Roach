import { PrismaClient } from "@prisma/client";
import { Client, Message } from 'discord.js';
import express from "express";
const prisma = new PrismaClient();
const client = new Client({ intents: [] });


const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

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
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id }
  });

  res.json(user);
});

app.post("/oauth", async(req, res) => {

});

client.on('ready', () => {
  console.log('Discord bot is ready.');
  app.listen(port, () => {
    console.log('Server is running on http://${host}:${port}');
  });
});

client.on('message', (message: Message) => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});


client.login(process.env.BOT_TOKEN);