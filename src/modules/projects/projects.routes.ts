import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "./projects.schemas.js";
import * as projects from "./projects.service.js";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

/** GET /api/projects?archived=false&q=web */
projectsRouter.get("/", async (req, res) => {
  const query = listProjectsQuerySchema.parse(req.query);
  res.json({ data: await projects.listProjects(req.user!.id, query) });
});

/** GET /api/projects/summary — métricas para el dashboard */
projectsRouter.get("/summary", async (req, res) => {
  res.json({ data: await projects.projectSummary(req.user!.id) });
});

projectsRouter.get("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  res.json({ data: await projects.getProject(id, req.user!.id) });
});

projectsRouter.post("/", validateBody(createProjectSchema), async (req, res) => {
  res.status(201).json({ data: await projects.createProject(req.user!.id, req.body) });
});

projectsRouter.patch(
  "/:id",
  validateBody(updateProjectSchema.refine((d) => Object.keys(d).length > 0, {
    message: "Envía al menos un campo para actualizar",
  })),
  async (req, res) => {
    const { id } = req.params as { id: string };
    res.json({ data: await projects.updateProject(id, req.user!.id, req.body) });
  },
);

projectsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  await projects.deleteProject(id, req.user!.id);
  res.status(204).end();
});
