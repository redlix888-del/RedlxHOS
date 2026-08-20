"use server";

import { prisma } from "../../lib/db";
import { revalidatePath } from "next/cache";
import { getSessionTeamId } from "../../lib/auth";

export async function updateProfileAvatar(sessionUserId: string, isLead: boolean, avatarUrl: string) {
  const activeSessionId = await getSessionTeamId();
  const cleanUserId = (sessionUserId || "").trim();
  const cleanAvatarUrl = (avatarUrl || "").trim();

  if (!activeSessionId || activeSessionId !== cleanUserId) {
    throw new Error("Unauthorized: Active session mismatch.");
  }

  if (isLead) {
    await prisma.team.update({
      where: { id: cleanUserId },
      data: { avatarUrl: cleanAvatarUrl },
    });
  } else {
    await prisma.teamMember.update({
      where: { id: cleanUserId },
      data: { avatarUrl: cleanAvatarUrl },
    });
  }

  revalidatePath("/team/dashboard/profile");
}

