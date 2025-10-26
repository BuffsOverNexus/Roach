import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { deleteBirthdayInGuild, getBirthdayInGuild, getBirthdaysInGuild } from "../api/birthdays";

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
  } catch (error) {
    res.status(500).send("Internal Server Error");
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
  } catch (error) {
    res.status(500).send("Internal Server Error");
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
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

export default router;