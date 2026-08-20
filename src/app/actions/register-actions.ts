"use server";

import { prisma } from "../../lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "../../lib/auth";

export async function registerParticipantAction(data: {
  hackathonId: string;
  ticketTierName: string;
  ticketPriceINR: number;
  fullName: string;
  email: string;
  phone?: string;
  transactionId: string;
  paymentMode: string;
}) {
  const hackathonId = (data.hackathonId || "").trim();
  const ticketTierName = (data.ticketTierName || "").trim();
  const ticketPriceINR = Math.max(0, Math.round(Number(data.ticketPriceINR) || 0));
  const fullName = (data.fullName || "").trim();
  const email = (data.email || "").trim().toLowerCase();
  const phone = (data.phone || "").trim() || null;
  const transactionId = (data.transactionId || "").trim();
  const paymentMode = (data.paymentMode || "").trim();

  if (!hackathonId || !ticketTierName || !fullName || !email || !transactionId || !paymentMode) {
    return { success: false, error: "All fields are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    // 1. Verify Hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      return { success: false, error: "Hackathon not found or inactive." };
    }

    // 2. Find or create participant
    let participant = await prisma.participant.findUnique({
      where: { email },
    });

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          fullName,
          email,
          phone,
        },
      });
    } else {
      participant = await prisma.participant.update({
        where: { email },
        data: {
          fullName,
          phone,
        },
      });
    }

    // 3. Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        hackathonId_participantId: {
          hackathonId,
          participantId: participant.id,
        },
      },
    });

    if (existing) {
      return { success: false, error: "You are already registered for this hackathon." };
    }

    // 4. Create registration with status Pending
    await prisma.registration.create({
      data: {
        hackathonId,
        participantId: participant.id,
        ticketTierName,
        ticketPriceINR,
        transactionId,
        paymentMode,
        paymentStatus: "Pending",
      },
    });

    revalidatePath(`/active-hacks/${hackathonId}`);
    revalidatePath("/organizer/dashboard/participants");

    return { success: true };
  } catch (error: any) {
    console.error("registerParticipantAction error:", error);
    return { success: false, error: "Failed to register. Please try again." };
  }
}

export async function updateRegistrationStatusAction(registrationId: string, status: "Verified" | "Rejected") {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Organizer login required." };
    }

    const cleanRegId = (registrationId || "").trim();
    if (!cleanRegId || (status !== "Verified" && status !== "Rejected")) {
      return { success: false, error: "Invalid registration parameters." };
    }

    // Verify registration's hackathon belongs to the logged-in organizer
    const registration = await prisma.registration.findUnique({
      where: { id: cleanRegId },
      include: { hackathon: true },
    });

    if (!registration || registration.hackathon.organizerId !== user.id) {
      return { success: false, error: "Unauthorized: Access denied." };
    }

    const updated = await prisma.registration.update({
      where: { id: cleanRegId },
      data: { paymentStatus: status },
    });

    revalidatePath("/organizer/dashboard/participants");
    revalidatePath(`/active-hacks/${updated.hackathonId}`);

    return { success: true };
  } catch (error: any) {
    console.error("updateRegistrationStatusAction error:", error);
    return { success: false, error: "Failed to update registration status." };
  }
}


