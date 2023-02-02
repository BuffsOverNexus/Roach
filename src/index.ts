import { PrismaClient } from "@prisma/client";
import express from "express";
const prisma = new PrismaClient();

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
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id }
  });

  res.json(user);
});

app.post("/oauth", async(req, res) => {

});