"use server";

import { prisma } from "../../lib/db";
import { getSessionUser, getSessionTeam } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export interface ProblemStatementData {
  title: string;
  track: string;
  description: string;
  difficulty?: string;
  pdfUrl?: string;
  resourceUrl?: string;
}

export async function createProblemStatement(
  hackathonId: string,
  data: ProblemStatementData
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Organizer login required." };
    }

    const cleanHackathonId = (hackathonId || "").trim();
    const cleanTitle = (data.title || "").trim();
    const cleanTrack = (data.track || "").trim();
    const cleanDescription = (data.description || "").trim();

    if (!cleanHackathonId || !cleanTitle || !cleanTrack || !cleanDescription) {
      return { success: false, error: "Title, track name, and description are required." };
    }

    // Verify organizer owns this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: cleanHackathonId,
        organizerId: user.id,
      },
    });

    if (!hackathon) {
      return { success: false, error: "Hackathon not found or access denied." };
    }

    const problemStatement = await prisma.problemStatement.create({
      data: {
        hackathonId: cleanHackathonId,
        title: cleanTitle,
        track: cleanTrack,
        description: cleanDescription,
        difficulty: (data.difficulty || "Medium").trim(),
        pdfUrl: (data.pdfUrl || "").trim() || null,
        resourceUrl: (data.resourceUrl || "").trim() || null,
      },
    });

    revalidatePath(`/organizer/dashboard/hackathons/${cleanHackathonId}`);
    revalidatePath("/team/dashboard/problem-statements");
    revalidatePath(`/active-hacks/${cleanHackathonId}`);

    return { success: true, problemStatement };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create problem statement." };
  }
}

export async function updateProblemStatement(
  id: string,
  data: ProblemStatementData
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Organizer login required." };
    }

    const cleanId = (id || "").trim();
    const cleanTitle = (data.title || "").trim();
    const cleanTrack = (data.track || "").trim();
    const cleanDescription = (data.description || "").trim();

    if (!cleanId || !cleanTitle || !cleanTrack || !cleanDescription) {
      return { success: false, error: "Title, track name, and description are required." };
    }

    const existing = await prisma.problemStatement.findUnique({
      where: { id: cleanId },
      include: { hackathon: true },
    });

    if (!existing || existing.hackathon.organizerId !== user.id) {
      return { success: false, error: "Problem statement not found or access denied." };
    }

    const updated = await prisma.problemStatement.update({
      where: { id: cleanId },
      data: {
        title: cleanTitle,
        track: cleanTrack,
        description: cleanDescription,
        difficulty: (data.difficulty || "Medium").trim(),
        pdfUrl: (data.pdfUrl || "").trim() || null,
        resourceUrl: (data.resourceUrl || "").trim() || null,
      },
    });

    revalidatePath(`/organizer/dashboard/hackathons/${existing.hackathonId}`);
    revalidatePath("/team/dashboard/problem-statements");
    revalidatePath(`/active-hacks/${existing.hackathonId}`);

    return { success: true, problemStatement: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update problem statement." };
  }
}

export async function deleteProblemStatement(id: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Organizer login required." };
    }

    const cleanId = (id || "").trim();
    const existing = await prisma.problemStatement.findUnique({
      where: { id: cleanId },
      include: { hackathon: true },
    });

    if (!existing || existing.hackathon.organizerId !== user.id) {
      return { success: false, error: "Problem statement not found or access denied." };
    }

    await prisma.problemStatement.delete({
      where: { id: cleanId },
    });

    revalidatePath(`/organizer/dashboard/hackathons/${existing.hackathonId}`);
    revalidatePath("/team/dashboard/problem-statements");
    revalidatePath(`/active-hacks/${existing.hackathonId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete problem statement." };
  }
}

export async function selectTeamProblemStatement(problemStatementId: string | null) {
  try {
    const team = await getSessionTeam();
    if (!team) {
      return { success: false, error: "Unauthorized: Team login required." };
    }

    if (!team.isLead) {
      return { success: false, error: "Only Team Leads can select or change the team's problem statement." };
    }

    if (problemStatementId) {
      const ps = await prisma.problemStatement.findUnique({
        where: { id: problemStatementId },
      });
      if (!ps || ps.hackathonId !== team.hackathonId) {
        return { success: false, error: "Invalid problem statement selected for this hackathon." };
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: {
        problemStatementId: problemStatementId || null,
      },
      include: {
        problemStatement: true,
      },
    });

    revalidatePath("/team/dashboard");
    revalidatePath("/team/dashboard/problem-statements");

    return { success: true, team: updatedTeam };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to select problem statement for team." };
  }
}

export async function fetchProblemStatementsForHackathon(hackathonId: string) {
  try {
    const statements = await prisma.problemStatement.findMany({
      where: { hackathonId },
      include: {
        teams: {
          select: { id: true, teamName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, statements };
  } catch (error: any) {
    return { success: false, error: error.message, statements: [] };
  }
}
