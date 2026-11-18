import { prisma } from "../../lib/prisma.js";
import { forbidden, notFound } from "../../lib/errors.js";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas.js";

const withCounts = {
  _count: { select: { tasks: true } },
} as const;

export function listProjects(
  ownerId: string,
  filters: { archived?: boolean | undefined; q?: string | undefined },
) {
  return prisma.project.findMany({
    where: {
      ownerId,
      ...(filters.archived === undefined ? { archived: false } : { archived: filters.archived }),
      ...(filters.q ? { name: { contains: filters.q } } : {}),
    },
    include: withCounts,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(id: string, ownerId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ...withCounts,
      tasks: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!project) throw notFound("Proyecto no encontrado");
  if (project.ownerId !== ownerId) throw forbidden();
  return project;
}

/** Comprueba pertenencia sin cargar el proyecto completo. */
export async function assertProjectOwner(projectId: string, ownerId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) throw notFound("Proyecto no encontrado");
  if (project.ownerId !== ownerId) throw forbidden();
}

export function createProject(ownerId: string, input: CreateProjectInput) {
  return prisma.project.create({ data: { ...input, ownerId }, include: withCounts });
}

export async function updateProject(id: string, ownerId: string, input: UpdateProjectInput) {
  await assertProjectOwner(id, ownerId);
  return prisma.project.update({ where: { id }, data: input, include: withCounts });
}

export async function deleteProject(id: string, ownerId: string) {
  await assertProjectOwner(id, ownerId);
  await prisma.project.delete({ where: { id } });
}

export async function projectSummary(ownerId: string) {
  const [projects, grouped] = await Promise.all([
    prisma.project.count({ where: { ownerId, archived: false } }),
    prisma.task.groupBy({
      by: ["status", "priority"],
      where: { project: { ownerId } },
      _count: { _all: true },
    }),
  ]);

  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
  const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>;

  for (const row of grouped) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + row._count._all;
    byPriority[row.priority] = (byPriority[row.priority] ?? 0) + row._count._all;
  }

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const done = byStatus.DONE ?? 0;

  return {
    projects,
    tasks: {
      total,
      byStatus,
      byPriority,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
    },
  };
}
