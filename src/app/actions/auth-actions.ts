"use server";

import { prisma } from "../../lib/db";
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie } from "../../lib/auth";
import { redirect } from "next/navigation";

export async function signUpAction(prevState: any, formData: FormData) {
  const fullName = (formData.get("fullName") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const designation = (formData.get("designation") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim() || null;
  const organizationName = (formData.get("organizationName") as string || "").trim();
  const website = (formData.get("website") as string || "").trim() || null;
  const password = formData.get("password") as string || "";
  const organizerKey = (formData.get("organizerKey") as string || "").trim();
  const secretKey = process.env.ORGANIZER_SECRET_KEY || "SNIST@VTAI2026";

  if (!fullName || !email || !designation || !organizationName || !password) {
    return { success: false, error: "Missing required fields." };
  }

  if (!organizerKey || organizerKey !== secretKey) {
    return { success: false, error: "Invalid Organizer Secret Access Key." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  try {
    const existing = await prisma.organizer.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: "Email is already registered." };
    }

    const passwordHash = hashPassword(password);

    const organizer = await prisma.organizer.create({
      data: {
        fullName,
        email,
        designation,
        phone,
        organizationName,
        website,
        passwordHash,
      },
    });

    await setSessionCookie(organizer.id);
  } catch (err: any) {
    if (err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("SignUp error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  redirect("/organizer/dashboard");
}

export async function signInAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string || "";
  const organizerKey = (formData.get("organizerKey") as string || "").trim();
  const secretKey = process.env.ORGANIZER_SECRET_KEY || "SNIST@VTAI2026";

  if (!email || !password || !organizerKey) {
    return { success: false, error: "Please enter email, password, and Organizer Secret Key." };
  }

  if (organizerKey !== secretKey) {
    return { success: false, error: "Invalid Organizer Secret Access Key." };
  }

  try {
    const organizer = await prisma.organizer.findUnique({
      where: { email },
    });

    if (!organizer) {
      return { success: false, error: "Invalid email or password." };
    }

    if (!organizer.passwordHash) {
      return { success: false, error: "This account was created via Google previously. Please register your account with a password." };
    }

    const isValid = verifyPassword(password, organizer.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    await setSessionCookie(organizer.id);
  } catch (err: any) {
    if (err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("SignIn error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  redirect("/organizer/dashboard");
}

export async function logOutAction() {
  await clearSessionCookie();
  redirect("/sign-in");
}

