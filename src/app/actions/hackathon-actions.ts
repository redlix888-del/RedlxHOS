"use server";

import { prisma } from "../../lib/db";
import { getSessionUserId } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function createHackathonAction(prevState: any, formData: FormData) {
  const organizerId = await getSessionUserId();
  if (!organizerId) {
    return { success: false, error: "Unauthorized: Organizer login required." };
  }

  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const startDateStr = (formData.get("startDate") as string || "").trim();
  const endDateStr = (formData.get("endDate") as string || "").trim();
  const location = (formData.get("location") as string || "").trim() || "Online";
  const prizePool = (formData.get("prizePool") as string || "").trim() || "$0";
  const tag = (formData.get("tag") as string || "").trim() || "Regional";
  const status = (formData.get("status") as string || "").trim() || "Draft";
  const bannerUrl = (formData.get("bannerUrl") as string || "").trim() || null;
  const ticketingLink = (formData.get("ticketingLink") as string || "").trim() || null;
  const locationLink = (formData.get("locationLink") as string || "").trim() || null;
  const qrCodeUrl = (formData.get("qrCodeUrl") as string || "").trim() || null;

  const ticketTiersJson = formData.get("ticketTiers") as string;
  let parsedTicketTiers: Array<{ name: string; priceINR: number }> = [];
  if (ticketTiersJson) {
    try {
      parsedTicketTiers = JSON.parse(ticketTiersJson);
    } catch (e) {
      return { success: false, error: "Invalid ticket tiers format." };
    }
  }

  const prizesJson = formData.get("prizes") as string;
  let parsedPrizes: Array<{ title: string; value: string; description?: string }> = [];
  if (prizesJson) {
    try {
      parsedPrizes = JSON.parse(prizesJson);
    } catch (e) {
      return { success: false, error: "Invalid prizes format." };
    }
  }

  if (!title || !description || !startDateStr || !endDateStr) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, error: "Invalid date format." };
    }

    if (startDate > endDate) {
      return { success: false, error: "Start date must be before or equal to end date." };
    }

    // Create the hackathon and its associated prizes
    const hackathon = await prisma.hackathon.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        location,
        prizePool,
        bannerUrl,
        ticketingLink,
        locationLink,
        qrCodeUrl,
        tag,
        status,
        organizerId,
        prizes: {
          create: parsedPrizes
            .filter((p) => p.title?.trim())
            .map((p) => ({
              title: p.title.trim(),
              value: (p.value || "").trim(),
              description: p.description?.trim() || null,
            })),
        },
        ticketTiers: {
          create: parsedTicketTiers
            .filter((t) => t.name?.trim())
            .map((t) => ({
              name: t.name.trim(),
              priceINR: Math.max(0, Math.round(Number(t.priceINR) || 0)),
            })),
        },
      },
    });

    if (status === "Active") {
      const mockParticipants = [
        { fullName: "Alex Rivera", email: `alex.rivera.${Date.now()}@example.com`, phone: "+1 555-0199" },
        { fullName: "Samantha Chen", email: `sam.chen.${Date.now()}@example.com`, phone: "+1 555-0142" },
        { fullName: "Marcus Johnson", email: `marcus.j.${Date.now()}@example.com`, phone: null },
      ];

      for (const mock of mockParticipants) {
        const participant = await prisma.participant.upsert({
          where: { email: mock.email },
          update: {},
          create: {
            fullName: mock.fullName,
            email: mock.email,
            phone: mock.phone,
          },
        });

        await prisma.registration.create({
          data: {
            hackathonId: hackathon.id,
            participantId: participant.id,
          },
        });
      }
    }

  } catch (err: any) {
    console.error("CreateHackathon error:", err);
    return { success: false, error: "Failed to create hackathon. Please try again." };
  }

  revalidatePath("/organizer/dashboard/hackathons");
  revalidatePath("/organizer/dashboard");
  revalidatePath("/organizer/dashboard/participants");
  return { success: true };
}

export async function updateHackathonAction(prevState: any, formData: FormData) {
  const organizerId = await getSessionUserId();
  if (!organizerId) {
    return { success: false, error: "Unauthorized: Organizer login required." };
  }

  const hackathonId = (formData.get("id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const startDateStr = (formData.get("startDate") as string || "").trim();
  const endDateStr = (formData.get("endDate") as string || "").trim();
  const location = (formData.get("location") as string || "").trim() || "Online";
  const prizePool = (formData.get("prizePool") as string || "").trim() || "$0";
  const bannerUrl = (formData.get("bannerUrl") as string || "").trim() || null;
  const ticketingLink = (formData.get("ticketingLink") as string || "").trim() || null;
  const locationLink = (formData.get("locationLink") as string || "").trim() || null;
  const qrCodeUrl = (formData.get("qrCodeUrl") as string || "").trim() || null;
  const tag = (formData.get("tag") as string || "").trim() || "Regional";
  const status = (formData.get("status") as string || "").trim() || "Draft";

  const ticketTiersJson = formData.get("ticketTiers") as string;
  let parsedTicketTiers: Array<{ name: string; priceINR: number }> = [];
  if (ticketTiersJson) {
    try {
      parsedTicketTiers = JSON.parse(ticketTiersJson);
    } catch (e) {
      return { success: false, error: "Invalid ticket tiers format." };
    }
  }

  const prizesJson = formData.get("prizes") as string;
  let parsedPrizes: Array<{ title: string; value: string; description?: string }> = [];
  if (prizesJson) {
    try {
      parsedPrizes = JSON.parse(prizesJson);
    } catch (e) {
      return { success: false, error: "Invalid prizes format." };
    }
  }

  if (!hackathonId || !title || !description || !startDateStr || !endDateStr) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, error: "Invalid date format." };
    }

    if (startDate > endDate) {
      return { success: false, error: "Start date must be before or equal to end date." };
    }

    // Verify ownership
    const existing = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!existing || existing.organizerId !== organizerId) {
      return { success: false, error: "Hackathon not found or unauthorized." };
    }

    // Update in transaction: delete old prizes & tiers, update hackathon, create new prizes & tiers
    await prisma.$transaction(async (tx) => {
      await tx.prize.deleteMany({
        where: { hackathonId },
      });

      await tx.ticketTier.deleteMany({
        where: { hackathonId },
      });

      await tx.hackathon.update({
        where: { id: hackathonId },
        data: {
          title,
          description,
          startDate,
          endDate,
          location,
          prizePool,
          bannerUrl,
          ticketingLink,
          locationLink,
          qrCodeUrl,
          tag,
          status,
          prizes: {
            create: parsedPrizes
              .filter((p) => p.title?.trim())
              .map((p) => ({
                title: p.title.trim(),
                value: (p.value || "").trim(),
                description: p.description?.trim() || null,
              })),
          },
          ticketTiers: {
            create: parsedTicketTiers
              .filter((t) => t.name?.trim())
              .map((t) => ({
                name: t.name.trim(),
                priceINR: Math.max(0, Math.round(Number(t.priceINR) || 0)),
              })),
          },
        },
      });
    });

  } catch (err: any) {
    console.error("UpdateHackathon error:", err);
    return { success: false, error: "Failed to update hackathon. Please try again." };
  }

  revalidatePath("/organizer/dashboard/hackathons");
  revalidatePath("/organizer/dashboard");
  revalidatePath("/organizer/dashboard/participants");
  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}/edit`);
  return { success: true };
}

export async function updateHackathonDatesAction(
  hackathonId: string,
  startDateISO: string,
  endDateISO: string
) {
  const organizerId = await getSessionUserId();
  if (!organizerId) {
    return { success: false, error: "Unauthorized: Organizer login required." };
  }

  try {
    const startDate = new Date(startDateISO);
    const endDate = new Date(endDateISO);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, error: "Invalid date format." };
    }

    if (startDate > endDate) {
      return { success: false, error: "Start date must be before or equal to end date." };
    }

    const existing = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!existing || existing.organizerId !== organizerId) {
      return { success: false, error: "Hackathon not found or unauthorized." };
    }

    await prisma.hackathon.update({
      where: { id: hackathonId },
      data: {
        startDate,
        endDate,
      },
    });

    revalidatePath("/organizer/dashboard");
    revalidatePath(`/timer/${hackathonId}`);
    return { success: true };
  } catch (err: any) {
    console.error("updateHackathonDatesAction error:", err);
    return { success: false, error: "Failed to update hackathon timer." };
  }
}


