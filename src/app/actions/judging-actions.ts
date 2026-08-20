"use server";

import { prisma } from "../../lib/db";
import { getSessionUser, setJudgeSessionCookie, clearJudgeSessionCookie } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function addJudge(
  hackathonId: string,
  name: string,
  description: string,
  imageUrl: string
) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    const cleanHackathonId = hackathonId.trim();
    const cleanName = name.trim();
    const cleanDescription = (description || "").trim();
    const cleanImageUrl = (imageUrl || "").trim() || null;

    if (!cleanHackathonId || !cleanName) {
      throw new Error("Judge name and hackathon ID are required.");
    }

    // Verify organizer owns this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: cleanHackathonId,
        organizerId: user.id,
      },
    });

    if (!hackathon) throw new Error("Hackathon not found or access denied");

    const judge = await prisma.judge.create({
      data: {
        hackathonId: cleanHackathonId,
        name: cleanName,
        description: cleanDescription,
        imageUrl: cleanImageUrl,
      },
    });

    revalidatePath("/organizer/dashboard/judging");
    revalidatePath("/team/dashboard/judges");

    return { success: true, judge };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteJudge(judgeId: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    // Verify organizer owns the related hackathon
    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: { hackathon: true },
    });

    if (!judge || judge.hackathon.organizerId !== user.id) {
      throw new Error("Access denied");
    }

    await prisma.judge.delete({
      where: { id: judgeId },
    });

    revalidatePath("/organizer/dashboard/judging");
    revalidatePath("/team/dashboard/judges");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addJudgingGuideline(hackathonId: string, content: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    const cleanHackathonId = hackathonId.trim();
    const cleanContent = content.trim();

    if (!cleanHackathonId || !cleanContent) {
      throw new Error("Guideline content is required.");
    }

    // Verify organizer owns this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: cleanHackathonId,
        organizerId: user.id,
      },
    });

    if (!hackathon) throw new Error("Hackathon not found or access denied");

    const guideline = await prisma.judgingGuideline.create({
      data: {
        hackathonId: cleanHackathonId,
        content: cleanContent,
      },
    });

    revalidatePath("/organizer/dashboard/judging");
    revalidatePath("/team/dashboard/judges");

    return { success: true, guideline };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteJudgingGuideline(guidelineId: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    // Verify organizer owns the related hackathon
    const guideline = await prisma.judgingGuideline.findUnique({
      where: { id: guidelineId },
      include: { hackathon: true },
    });

    if (!guideline || guideline.hackathon.organizerId !== user.id) {
      throw new Error("Access denied");
    }

    await prisma.judgingGuideline.delete({
      where: { id: guidelineId },
    });

    revalidatePath("/organizer/dashboard/judging");
    revalidatePath("/team/dashboard/judges");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateJudgeAccessCode(judgeId: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    // Verify organizer owns the related hackathon
    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: { hackathon: true },
    });

    if (!judge || judge.hackathon.organizerId !== user.id) {
      throw new Error("Access denied");
    }

    // Generate unique 6-digit access code
    let code = "";
    let isUnique = false;
    let attempts = 0;
    const now = new Date();

    while (!isUnique && attempts < 100) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existingActiveJudge = await prisma.judge.findFirst({
        where: {
          loginCode: code,
          loginCodeExpiresAt: {
            gte: now,
          },
        },
      });
      if (!existingActiveJudge) {
        isUnique = true;
      }
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await prisma.judge.update({
      where: { id: judgeId },
      data: {
        loginCode: code,
        loginCodeExpiresAt: expiresAt,
      },
    });

    revalidatePath("/organizer/dashboard/judging");
    return { success: true, code, expiresAt };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginJudgeAction(code: string) {
  try {
    const trimmedCode = (code || "").trim();
    if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
      throw new Error("Access code must be exactly 6 digits.");
    }

    const judge = await prisma.judge.findFirst({
      where: {
        loginCode: trimmedCode,
        loginCodeExpiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!judge) {
      throw new Error("Access code is invalid or has expired (validity is 5 minutes).");
    }

    // Set signed cookie session for judge
    await setJudgeSessionCookie(judge.id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutJudgeAction() {
  try {
    await clearJudgeSessionCookie();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


