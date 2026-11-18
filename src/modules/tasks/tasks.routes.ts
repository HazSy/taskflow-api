import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from "./tasks.schemas.js";
import * as tasks from "./tasks.service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/", async (req, res) => {
  const query = listTasksQuerySchema.parse(req.query);
  res.json({ data: await tasks.listTasks(req.user!.id, query) });
});

tasksRouter.post("/", validateBody(createTaskSchema), async (req, res) => {
  res.status(201).json({ data: await tasks.createTask(req.user!.id, req.body) });
});

tasksRouter.patch("/:id", validateBody(updateTaskSchema), async (req, res) => {
  const { id } = req.params as { id: string };
  res.json({ data: await tasks.updateTask(id, req.user!.id, req.body) });
});

tasksRouter.delete("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  await tasks.deleteTask(id, req.user!.id);
  res.status(204).end();
});
