"use server";

import { prisma } from "../../lib/db";
import { revalidatePath } from "next/cache";
import { getSessionTeam, getSessionUser, getSessionJudge } from "../../lib/auth";

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

export async function submitProject(formData: FormData) {
  const teamId = (formData.get("teamId") as string || "").trim();
  const hackathonId = (formData.get("hackathonId") as string || "").trim();
  const githubUrl = (formData.get("githubUrl") as string || "").trim();
  const liveUrl = (formData.get("liveUrl") as string | null)?.trim() || null;
  const projectName = (formData.get("projectName") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;

  if (!githubUrl) {
    throw new Error("GitHub URL is required.");
  }

  if (!isValidHttpUrl(githubUrl)) {
    throw new Error("GitHub URL must be a valid HTTP/HTTPS link.");
  }

  if (liveUrl && !isValidHttpUrl(liveUrl)) {
    throw new Error("Live Demo URL must be a valid HTTP/HTTPS link.");
  }

  const team = await getSessionTeam();
  if (!team || team.id !== teamId || team.hackathonId !== hackathonId) {
    throw new Error("Unauthorized: Invalid team session.");
  }

  await prisma.projectSubmission.upsert({
    where: { teamId },
    update: { githubUrl, liveUrl, projectName, description, updatedAt: new Date() },
    create: { teamId, hackathonId, githubUrl, liveUrl, projectName, description },
  });

  revalidatePath("/team/dashboard/project");
  revalidatePath("/organizer/dashboard/submissions");
}

export async function getSubmissionByTeam(teamId: string) {
  const team = await getSessionTeam();
  const organizer = await getSessionUser();
  const judge = await getSessionJudge();

  if (team && team.id === teamId) {
    return prisma.projectSubmission.findUnique({ where: { teamId } });
  }

  if (organizer) {
    const targetTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: { hackathon: true }
    });
    if (targetTeam && targetTeam.hackathon.organizerId === organizer.id) {
      return prisma.projectSubmission.findUnique({ where: { teamId } });
    }
  }

  if (judge) {
    const targetTeam = await prisma.team.findUnique({
      where: { id: teamId }
    });
    if (targetTeam && targetTeam.hackathonId === judge.hackathonId) {
      return prisma.projectSubmission.findUnique({ where: { teamId } });
    }
  }

  throw new Error("Unauthorized");
}

export async function getAllSubmissions(hackathonId: string) {
  const organizer = await getSessionUser();
  const judge = await getSessionJudge();

  if (organizer) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (hackathon && hackathon.organizerId === organizer.id) {
      return prisma.projectSubmission.findMany({
        where: { hackathonId },
        include: { team: { select: { teamName: true, teamLeadName: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      });
    }
  }

  if (judge && judge.hackathonId === hackathonId) {
    return prisma.projectSubmission.findMany({
      where: { hackathonId },
      include: { team: { select: { teamName: true, teamLeadName: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    });
  }

  throw new Error("Unauthorized");
}

