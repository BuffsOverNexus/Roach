import { PrismaClient } from "@prisma/client";
import express, { Request, Response, Router } from "express";
import { generateException } from "../util/exception_handling";
import {
  getGuild,
  getGuildById,
  createGuild,
  updateChannelInGuild,
} from "../api/guilds";

const router: Router = express.Router();
const prisma = new PrismaClient();

router.get("/guild/by-raw", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = String(req.query.guildId);
      const guild = await getGuild(prisma, guildId);
      res.json(guild);
    } else {
      res.status(400).send("This API requires: guildId (raw guild id)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

router.get("/guild/by-id", async (req, res) => {
  try {
    if (req.query.guildId) {
      const guildId = Number(req.query.guildId);
      const guild = await getGuildById(prisma, guildId);
      if (!guild) {
        res.status(400).send("Invalid guild identifier (non-raw).");
      } else {
        res.json(guild);
      }
    } else {
      res.status(400).send("This API requires: id (non-raw)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});
router.post("/guild", async (req, res) => {
  try {
    if (
      req.body.userId &&
      req.body.guildId &&
      req.body.guildName &&
      req.body.channelName &&
      req.body.channelId
    ) {
      const userId = String(req.body.userId);
      const guildId = String(req.body.guildId);
      const guildName = String(req.body.guildName);
      const channelName = String(req.body.channelName);
      const channelId = String(req.body.channelId);
      const guild = await createGuild(
        prisma,
        userId,
        guildId,
        guildName,
        channelId,
        channelName
      );
      res.json(guild);
    } else {
      res.status(400).send("Request requires: guildId, userId, guildName");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

router.patch("/guild/channel", async (req, res) => {
  try {
    if (req.body.guildId && req.body.channelName && req.body.channelId) {
      const guildId = req.body.guildId;
      const channelName = req.body.channelName;
      const channelId = req.body.channelId;
      const updatedGuild = await updateChannelInGuild(
        prisma,
        guildId,
        channelName,
        channelId
      );
      res.json(updatedGuild);
    } else {
      res
        .status(400)
        .send("This API requires: guildId, channelName, guildName");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

export default router;