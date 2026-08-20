"use server";

import { prisma } from "../../lib/db";
import { getSessionUser } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(
  hackathonId: string,
  title: string,
  content: string
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new Error("Unauthorized: Organizer login required.");
    }

    const cleanHackathonId = (hackathonId || "").trim();
    const cleanTitle = (title || "").trim();
    const cleanContent = (content || "").trim();

    if (!cleanHackathonId || !cleanTitle || !cleanContent) {
      throw new Error("Title and content are required.");
    }

    // Verify organizer owns this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: cleanHackathonId,
        organizerId: user.id,
      },
    });

    if (!hackathon) {
      throw new Error("Hackathon not found or access denied.");
    }

    await prisma.announcement.create({
      data: {
        hackathonId: cleanHackathonId,
        title: cleanTitle,
        content: cleanContent,
      },
    });

    revalidatePath("/organizer/dashboard/announcements");
    revalidatePath("/team/dashboard/announcements");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new Error("Unauthorized: Organizer login required.");
    }

    const cleanAnnouncementId = (announcementId || "").trim();

    // Verify the organizer owns the hackathon related to this announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: cleanAnnouncementId },
      include: { hackathon: true },
    });

    if (!announcement || announcement.hackathon.organizerId !== user.id) {
      throw new Error("Access denied: You do not own this hackathon.");
    }

    await prisma.announcement.delete({
      where: { id: cleanAnnouncementId },
    });

    revalidatePath("/organizer/dashboard/announcements");
    revalidatePath("/team/dashboard/announcements");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

