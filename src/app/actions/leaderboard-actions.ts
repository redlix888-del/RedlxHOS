"use server";

import { prisma } from "../../lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser, getSessionJudge } from "../../lib/auth";

export async function updateTeamScoreAction(teamId: string, score: number) {
  try {
    const organizer = await getSessionUser();
    const judge = await getSessionJudge();

    if (!organizer && !judge) {
      return { success: false, error: "Unauthorized: Access denied." };
    }

    const cleanTeamId = (teamId || "").trim();
    const cleanScore = Math.max(0, Math.min(1000000, Math.round(Number(score) || 0)));

    const team = await prisma.team.findUnique({
      where: { id: cleanTeamId },
      include: { hackathon: true },
    });

    if (!team) {
      return { success: false, error: "Team not found." };
    }

    // If organizer, must own the hackathon
    if (organizer && team.hackathon.organizerId !== organizer.id) {
      return { success: false, error: "Unauthorized: Hackathon not owned by organizer." };
    }

    // If judge, must be assigned to the hackathon
    if (judge && team.hackathonId !== judge.hackathonId) {
      return { success: false, error: "Unauthorized: Judge is not assigned to this hackathon." };
    }

    await prisma.team.update({
      where: { id: cleanTeamId },
      data: { score: cleanScore },
    });

    revalidatePath("/organizer/dashboard/leaderboard");
    revalidatePath("/team/dashboard/leaderboard");
    revalidatePath(`/leaderboard/${team.hackathonId}`);
    return { success: true };
  } catch (err) {
    console.error("updateTeamScoreAction error:", err);
    return { success: false, error: "Failed to update score." };
  }
}

export async function togglePublishLeaderboardAction(hackathonId: string, publish: boolean) {
  try {
    const organizer = await getSessionUser();
    if (!organizer) {
      return { success: false, error: "Unauthorized: Organizer login required." };
    }

    const cleanHackathonId = (hackathonId || "").trim();

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: cleanHackathonId },
    });

    if (!hackathon || hackathon.organizerId !== organizer.id) {
      return { success: false, error: "Unauthorized: Hackathon not found or access denied." };
    }

    await prisma.hackathon.update({
      where: { id: cleanHackathonId },
      data: { publishLeaderboard: !!publish },
    });

    revalidatePath("/organizer/dashboard/leaderboard");
    revalidatePath("/team/dashboard/leaderboard");
    revalidatePath(`/leaderboard/${cleanHackathonId}`);
    return { success: true };
  } catch (err) {
    console.error("togglePublishLeaderboardAction error:", err);
    return { success: false, error: "Failed to toggle status." };
  }
}

