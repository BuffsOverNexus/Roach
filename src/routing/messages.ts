import { PrismaClient } from "@prisma/client";
import express, { Request, Response, Router } from "express";
import { generateException } from "../util/exception_handling";
import { deleteMessage, getMessageById } from "../api/messages";
import { regenerateMessage } from "../message/generate_message";
import { handleGuildMessages, addMessage } from "../message/guild_messages";

const router: Router = express.Router();
const prisma = new PrismaClient();

// Retrieve all messages of a guild.
router.get("/messages", async (req: Request, res: Response) => {
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
router.post("/message", async (req: Request, res: Response) => {
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

// Delete a message (and all of the reactions)
router.delete("/message", async (req: Request, res: Response) => {
  try {
    if (req.query.id) {
      const messageId = Number(req.query.id);
      const result = await deleteMessage(prisma, messageId);
      res.json(result);
    } else {
      res.status(400).send("This API requires: messageId (non-raw)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Get a message
router.get("/message", async (req: Request, res: Response) => {
  try {
    if (req.query.id) {
      const messageId = Number(req.query.id);
      const result = await getMessageById(prisma, messageId);
      res.json(result);
    } else {
      res.status(400).send("This API requires: messageId (non-raw)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

export default router;
