"use server";

import { prisma } from "../../lib/db";
import { getSessionUserId, verifyPassword, hashPassword } from "../../lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(prevState: any, formData: FormData) {
  const organizerId = await getSessionUserId();
  if (!organizerId) {
    return { success: false, error: "Unauthorized: Organizer login required." };
  }

  const fullName = (formData.get("fullName") as string || "").trim();
  const designation = (formData.get("designation") as string || "").trim();
  const organizationName = (formData.get("organizationName") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim() || null;
  const website = (formData.get("website") as string || "").trim() || null;

  const currentPassword = formData.get("currentPassword") as string || "";
  const newPassword = formData.get("newPassword") as string || "";

  if (!fullName || !designation || !organizationName) {
    return { success: false, error: "Missing required profile fields." };
  }

  try {
    const currentOrganizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
    });

    if (!currentOrganizer) {
      return { success: false, error: "Organizer not found." };
    }

    const updateData: any = {
      fullName,
      designation,
      organizationName,
      phone,
      website,
    };

    if (currentPassword && newPassword) {
      if (!currentOrganizer.passwordHash) {
        return { success: false, error: "Google authenticated accounts cannot change password here." };
      }
      const isPasswordValid = verifyPassword(currentPassword, currentOrganizer.passwordHash);
      if (!isPasswordValid) {
        return { success: false, error: "Incorrect current password." };
      }

      if (newPassword.length < 8) {
        return { success: false, error: "New password must be at least 8 characters." };
      }

      updateData.passwordHash = hashPassword(newPassword);
    } else if (currentPassword || newPassword) {
      return { success: false, error: "Both current password and new password are required to change password." };
    }

    await prisma.organizer.update({
      where: { id: organizerId },
      data: updateData,
    });

  } catch (err: any) {
    console.error("UpdateProfile error:", err);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/organizer/dashboard/settings");
  revalidatePath("/organizer/dashboard");
  return { success: true };
}

