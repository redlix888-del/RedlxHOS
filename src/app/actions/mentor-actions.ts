"use server";

import { prisma } from "../../lib/db";
import { getSessionUser, setMentorSessionCookie, clearMentorSessionCookie } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function addMentor(
  hackathonId: string,
  name: string,
  description: string,
  imageUrl: string,
  expertise: string
) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    const cleanHackathonId = hackathonId.trim();
    const cleanName = name.trim();
    const cleanDescription = (description || "").trim();
    const cleanImageUrl = (imageUrl || "").trim() || null;
    const cleanExpertise = (expertise || "").trim() || null;

    if (!cleanHackathonId || !cleanName) {
      throw new Error("Mentor name and hackathon ID are required.");
    }

    // Verify organizer owns this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: cleanHackathonId,
        organizerId: user.id,
      },
    });

    if (!hackathon) throw new Error("Hackathon not found or access denied");

    const mentor = await prisma.mentor.create({
      data: {
        hackathonId: cleanHackathonId,
        name: cleanName,
        description: cleanDescription,
        imageUrl: cleanImageUrl,
        expertise: cleanExpertise,
      },
    });

    revalidatePath("/organizer/dashboard/mentors");

    return { success: true, mentor };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMentor(mentorId: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    // Verify organizer owns the related hackathon
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: { hackathon: true },
    });

    if (!mentor || mentor.hackathon.organizerId !== user.id) {
      throw new Error("Access denied");
    }

    await prisma.mentor.delete({
      where: { id: mentorId },
    });

    revalidatePath("/organizer/dashboard/mentors");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateMentorAccessCode(mentorId: string) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized: Organizer login required.");

    // Verify organizer owns the related hackathon
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: { hackathon: true },
    });

    if (!mentor || mentor.hackathon.organizerId !== user.id) {
      throw new Error("Access denied");
    }

    // Generate unique 6-digit access code
    let code = "";
    let isUnique = false;
    let attempts = 0;
    const now = new Date();

    while (!isUnique && attempts < 100) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existingActiveMentor = await prisma.mentor.findFirst({
        where: {
          loginCode: code,
          loginCodeExpiresAt: {
            gte: now,
          },
        },
      });
      if (!existingActiveMentor) {
        isUnique = true;
      }
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await prisma.mentor.update({
      where: { id: mentorId },
      data: {
        loginCode: code,
        loginCodeExpiresAt: expiresAt,
      },
    });

    revalidatePath("/organizer/dashboard/mentors");
    return { success: true, code, expiresAt };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginMentorAction(code: string) {
  try {
    const trimmedCode = (code || "").trim();
    if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
      throw new Error("Access code must be exactly 6 digits.");
    }

    const mentor = await prisma.mentor.findFirst({
      where: {
        loginCode: trimmedCode,
        loginCodeExpiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!mentor) {
      throw new Error("Access code is invalid or has expired (validity is 5 minutes).");
    }

    // Set signed cookie session for mentor
    await setMentorSessionCookie(mentor.id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutMentorAction() {
  try {
    await clearMentorSessionCookie();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
