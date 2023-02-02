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
})

app.get("/user/:id", async(req, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id }
  })
})

app.post("/user", async (req, res) => {
  const user = await prisma.user.create({
    data: {
      completed: false,
      createdAt: new Date(),
      text: req.body.text ?? "Empty todo",
    },
  });
});


app.get("/", async (req, res) => {
  res.send(
    `
  <h1>Todo REST API</h1>
  <h2>Available Routes</h2>
  <pre>
    GET, POST /todos
    GET, PUT, DELETE /todos/:id
  </pre>
  `.trim(),
  );
});

app.listen(Number(port), "0.0.0.0", () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
