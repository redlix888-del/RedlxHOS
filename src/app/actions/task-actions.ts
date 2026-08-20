"use server";

import { prisma } from "../../lib/db";
import { revalidatePath } from "next/cache";
import { getSessionTeam } from "../../lib/auth";

export async function createTaskAction(
  teamId: string,
  title: string,
  description: string,
  assigneeId: string,
  assigneeName: string,
  assigneeRole: string
) {
  const sessionTeam = await getSessionTeam();
  const cleanTeamId = (teamId || "").trim();
  const cleanTitle = (title || "").trim();
  const cleanDescription = (description || "").trim();
  const cleanAssigneeId = (assigneeId || "").trim();
  const cleanAssigneeName = (assigneeName || "").trim();
  const cleanAssigneeRole = (assigneeRole || "Teammate").trim();

  if (!sessionTeam || sessionTeam.id !== cleanTeamId) {
    throw new Error("Unauthorized: Invalid team session.");
  }

  if (!cleanTitle) {
    throw new Error("Task title is required.");
  }

  await prisma.task.create({
    data: {
      teamId: cleanTeamId,
      title: cleanTitle,
      description: cleanDescription,
      status: "TO_DO",
      assigneeId: cleanAssigneeId,
      assigneeName: cleanAssigneeName,
      assigneeRole: cleanAssigneeRole,
    },
  });

  await prisma.taskLog.create({
    data: {
      teamId: cleanTeamId,
      message: `Created task "${cleanTitle}" assigned to ${cleanAssigneeName} (${cleanAssigneeRole})`,
    },
  });

  revalidatePath("/team/dashboard/tasks");
}

export async function moveTaskAction(
  teamId: string,
  taskId: string,
  targetStatus: string,
  completedByName: string | null,
  completedByRole: string | null
) {
  const sessionTeam = await getSessionTeam();
  const cleanTeamId = (teamId || "").trim();
  const cleanTaskId = (taskId || "").trim();
  const validStatuses = ["TO_DO", "IN_PROGRESS", "COMPLETED"];

  if (!validStatuses.includes(targetStatus)) {
    throw new Error("Invalid task status.");
  }

  if (!sessionTeam || sessionTeam.id !== cleanTeamId) {
    throw new Error("Unauthorized: Invalid team session.");
  }

  const task = await prisma.task.findUnique({
    where: { id: cleanTaskId },
  });

  if (!task || task.teamId !== cleanTeamId) {
    throw new Error("Task not found or access denied.");
  }

  const completedData = {
    completedById: targetStatus === "COMPLETED" ? task.assigneeId : null,
    completedByName: targetStatus === "COMPLETED" ? ((completedByName || task.assigneeName).trim()) : null,
    completedByRole: targetStatus === "COMPLETED" ? ((completedByRole || task.assigneeRole).trim()) : null,
    completedAt: targetStatus === "COMPLETED"
      ? new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", second: "numeric" })
      : null,
  };

  await prisma.task.update({
    where: { id: cleanTaskId },
    data: {
      status: targetStatus,
      ...completedData,
    },
  });

  const colName =
    targetStatus === "IN_PROGRESS" ? "In Progress" : targetStatus === "COMPLETED" ? "Completed" : "To Do";
  let logMsg = `Moved "${task.title}" to ${colName}`;
  if (targetStatus === "COMPLETED") {
    logMsg += ` (Marked complete by ${completedByName || task.assigneeName} - ${completedByRole || task.assigneeRole})`;
  }

  await prisma.taskLog.create({
    data: {
      teamId: cleanTeamId,
      message: logMsg,
    },
  });

  revalidatePath("/team/dashboard/tasks");
}

export async function deleteTaskAction(teamId: string, taskId: string, title: string) {
  const sessionTeam = await getSessionTeam();
  const cleanTeamId = (teamId || "").trim();
  const cleanTaskId = (taskId || "").trim();

  if (!sessionTeam || sessionTeam.id !== cleanTeamId) {
    throw new Error("Unauthorized: Invalid team session.");
  }

  const task = await prisma.task.findUnique({
    where: { id: cleanTaskId },
  });

  if (!task || task.teamId !== cleanTeamId) {
    throw new Error("Unauthorized: Task not found or access denied.");
  }

  await prisma.task.delete({
    where: { id: cleanTaskId },
  });

  await prisma.taskLog.create({
    data: {
      teamId: cleanTeamId,
      message: `Deleted task "${(title || task.title).trim()}"`,
    },
  });

  revalidatePath("/team/dashboard/tasks");
}

