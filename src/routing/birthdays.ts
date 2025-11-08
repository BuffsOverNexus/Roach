import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { createBirthdayInGuild, deleteBirthdayInGuild, getAllBirthdaysInGuild, getBirthdayInGuild, getBirthdaysInGuild, getBirthdaysToday } from "../api/birthdays";
import { generateException } from "../util/exception_handling";

const router: Router = Router();
const prisma = new PrismaClient();

router.get("/birthdays", async (req, res) => {
  try {
    if (req.query.guildId) {
        const guildId = Number(req.query.guildId);
        const birthdays = await getBirthdaysInGuild(prisma, guildId);
        res.json(birthdays);
    }
    else {
        res.status(400).send("This API requires: guildId");
    }   
  } catch (e) {
    generateException(res, e);
  }
});

router.get("/birthday", async (req, res) => {
  try {
    if (req.query.guildId && req.query.userId) {
      const guildId = Number(req.query.guildId);
      const userId = String(req.query.userId); // Raw user id from Discord as string
      const birthday = await getBirthdayInGuild(prisma, guildId, userId);
      res.json(birthday);
    } else {
      res.status(400).send("This API requires: guildId (roach) and userId (raw)");
    }
  } catch (e) {
    generateException(res, e);
  }
});

router.delete("/birthday", async (req, res) => {
  try {
    if (req.query.guildId && req.query.userId) {
      const guildId = Number(req.query.guildId);
      const userId = String(req.query.userId); // Raw user id from Discord as string
      const deleted = await deleteBirthdayInGuild(prisma, guildId, userId);
      if (deleted) {
        res.status(200).send("Birthday deleted successfully");
      } else {
        res.status(404).send("Birthday not found");
      }
    } else {
      res.status(400).send("This API requires: guildId (roach) and userId (raw)");
    }
  } catch (e) {
    generateException(res, e);
  }
});

router.get("/birthdays/today", async (req, res) => {
  try {
    if (req.query.month && req.query.day) {
      const month = Number(req.query.month);
      const day = Number(req.query.day);
      const birthdays = await getBirthdaysToday(prisma, month, day);
      res.json(birthdays);
    } else {
      res.status(400).send("This API requires: month and day");
    }
  } catch (e) {
    generateException(res, e);
  }
});

router.get("/birthdays/today/guild", async (req, res) => {
  try {
    if (req.query.month && req.query.day && req.query.guildId) {
      const month = Number(req.query.month);
      const day = Number(req.query.day);
      const guildId = Number(req.query.guildId);
      const birthdays = await getAllBirthdaysInGuild(prisma, month, day, guildId);
      res.json(birthdays);
    } else {
      res.status(400).send("This API requires: month, day, and guildId");
    }
  } catch (e) {
    generateException(res, e);
  }
});

router.post("/birthday", async (req, res) => {
  try {
    const { guildId, userId, month, day, username, timezone } = req.body;
    // Add logic to create or update a birthday here
    if (!guildId || !userId || !month || !day || !username || !timezone) {
      return res.status(400).send("This API requires: guildId, userId, month, day, username, timezone");
    }
    const result = await createBirthdayInGuild(prisma, guildId, userId, username, day, month, timezone);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(500).send("Failed to save birthday");
    }
  } catch (e) {
    generateException(res, e);
  }
});

export default router;