import { PrismaClient } from "@prisma/client";
import { createUser, getUser, patchUserLastLogin } from "../api/users";
import express, { Request, Response, Router } from "express";
import { generateException } from "../util/exception_handling";
import { getGuildsFromUser } from "../api/guilds";

const router: Router = express.Router();
const prisma = new PrismaClient();

// Get specific user
router.get("/user/:id", async (req: Request, res: Response) => {
  try {
    if (req.params.id) {
      const userId = req.params.id;
      const user = await getUser(prisma, userId);

      if (user)
        res.json(user);
      else
        res.status(400).send("You must enter in a valid userId");
    } else {
      res.status(400).send("This API requires: id (userId)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

// Create user
router.post("/user", async (req, res) => {
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

router.get("/user/guild/:id", async (req, res) => {
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

router.patch("/user/lastLogin", async (req, res) => {
  try {
    if (req.query.userId) {
      const userId = String(req.query.userId);
      const updatedUser = await patchUserLastLogin(prisma, userId);
      res.json(updatedUser);
    } else {
      res.status(400).send("This API requires: userId (user raw id)");
    }
  } catch (e: any) {
    generateException(res, e);
  }
});

export default router;
