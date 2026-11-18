import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { assertProjectOwner } from "../projects/projects.service.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schemas.js";

export async function listTasks(ownerId: string, query: ListTasksQuery) {
  const where = {
    project: { ownerId },
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: query.take,
      skip: query.skip,
      include: { project: { select: { id: true, name: true, color: true } } },
    }),
    prisma.task.count({ where }),
  ]);

  return { items, total, take: query.take, skip: query.skip };
}

export async function createTask(ownerId: string, input: CreateTaskInput) {
  await assertProjectOwner(input.projectId, ownerId);
  return prisma.task.create({ data: input });
}

export async function updateTask(id: string, ownerId: string, input: UpdateTaskInput) {
  const task = await prisma.task.findFirst({
    where: { id, project: { ownerId } },
    select: { id: true },
  });
  if (!task) throw notFound("Tarea no encontrada");
  if (input.projectId) await assertProjectOwner(input.projectId, ownerId);

  return prisma.task.update({ where: { id }, data: input });
}

export async function deleteTask(id: string, ownerId: string) {
  const task = await prisma.task.findFirst({
    where: { id, project: { ownerId } },
    select: { id: true },
  });
  if (!task) throw notFound("Tarea no encontrada");
  await prisma.task.delete({ where: { id } });
}
