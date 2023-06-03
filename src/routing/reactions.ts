import { PrismaClient } from "@prisma/client";
import express, { Request, Response, Router } from "express";
import { generateException } from "../util/exception_handling";
import {
  createReaction,
  createReactions,
  getReactionsInMessage,
  getReactionsInMessageById,
  getMessageReactionsInGuild,
  deleteReaction,
} from "../api/reactions";
import { ReactionRequest } from "../models/reaction_request";

const router: Router = express.Router();
const prisma = new PrismaClient();

/**
 * Create a reaction via having a message id and
 */
router.post("/reaction", async (req: Request, res: Response) => {
  try {
    if (
      req.body.guildId &&
      req.body.messageId &&
      req.body.roleId &&
      req.body.roleName &&
      req.body.emoteId
    ) {
      const messageId = Number(req.body.messageId);
      const guildId = String(req.body.guildId);
      const roleId = String(req.body.roleId);
      const roleName = String(req.body.roleName);
      const emoteId = String(req.body.emoteId);

      const reaction = await createReaction(
        prisma,
        messageId,
        roleId,
        emoteId,
        guildId,
        roleName
      );
      res.json(reaction);
    } else {
      res
        .status(400)
        .send(
          "This request requires: guildId, messageId (non-raw), roleId, emoteId"
        );
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

/**
 * You can create many reactions instead of just one.
 */
router.post("/reactions", async (req: Request, res: Response) => {
  try {
    if (req.body.guildId && req.body.messageId && req.body.reactions) {
      const reactions = req.body.reactions as ReactionRequest[];
      const guildId = String(req.body.guildId);
      const messageId = Number(req.body.messageId);

      const createdReactions = await createReactions(
        prisma,
        messageId,
        guildId,
        reactions
      );
      res.json(createdReactions);
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

router.get("/reactions", async (req: Request, res: Response) => {
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

router.get("/reactions/by-id", async (req: Request, res: Response) => {
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
router.get("/reactions/by-guild", async (req: Request, res: Response) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const reactions = await getMessageReactionsInGuild(prisma, guildId);
      res.json(reactions);
    } else {
      res.status(400).send("This request requires: guildId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

router.delete("/reaction", async (req: Request, res: Response) => {
  try {
    if (req.query.reactionId) {
      const reactionId = Number(req.query.reactionId);
      const result = await deleteReaction(prisma, reactionId);
      res.json(result);
    } else {
      res.status(400).send("This API requires: reactionId");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

export default router;
