"use server";

import { prisma } from "../../lib/db";
import { hashPassword, verifyPassword, setTeamSessionCookie, clearTeamSessionCookie } from "../../lib/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

function generateJoinCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function teamSignUpAction(prevState: any, formData: FormData) {
  const teamName = (formData.get("teamName") as string || "").trim();
  const teamLeadName = (formData.get("teamLeadName") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string || "";
  const hackathonId = (formData.get("hackathonId") as string || "").trim();

  if (!teamName || !teamLeadName || !email || !password || !hackathonId) {
    return { success: false, error: "Missing required fields." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    // 1. Verify Hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      return { success: false, error: "Hackathon not found or inactive." };
    }

    // 2. Check if email is registered as Team Lead or Team Member
    const existingTeam = await prisma.team.findUnique({
      where: { email },
    });
    const existingMember = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (existingTeam || existingMember) {
      return { success: false, error: "Email is already registered for a team or member." };
    }

    const passwordHash = hashPassword(password);

    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existingCode = await prisma.team.findUnique({
        where: { joinCode },
      });
      if (!existingCode) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    const team = await prisma.team.create({
      data: {
        teamName,
        teamLeadName,
        email,
        passwordHash,
        joinCode,
        hackathonId,
      },
    });

    await prisma.message.create({
      data: {
        content: `System added ${teamLeadName} (Team Lead) to the console.`,
        channelId: "general",
        senderName: "System",
        senderAvatar: "SYS",
        senderRole: "System",
        teamId: team.id,
        hackathonId: hackathonId,
      },
    });

    await setTeamSessionCookie(team.id);
  } catch (err: any) {
    if (err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Team SignUp error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  redirect("/team/dashboard");
}

export async function teamSignInAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string || "";
  const hackathonId = (formData.get("hackathonId") as string || "").trim();

  if (!email || !password) {
    return { success: false, error: "Please enter your email and password." };
  }

  try {
    // Check Team (Team Lead)
    const team = await prisma.team.findUnique({
      where: { email },
    });

    if (team) {
      if (hackathonId && team.hackathonId !== hackathonId) {
        return { success: false, error: "Credentials not registered for this hackathon." };
      }
      if (team.passwordHash) {
        const isValid = verifyPassword(password, team.passwordHash);
        if (isValid) {
          await setTeamSessionCookie(team.id);
          redirect("/team/dashboard");
        }
      }
    }

    // Check TeamMember
    const member = await prisma.teamMember.findUnique({
      where: { email },
      include: {
        team: true,
      },
    });

    if (member) {
      if (hackathonId && member.team.hackathonId !== hackathonId) {
        return { success: false, error: "Credentials not registered for this hackathon." };
      }
      if (member.passwordHash) {
        const isValid = verifyPassword(password, member.passwordHash);
        if (isValid) {
          await setTeamSessionCookie(member.id);
          redirect("/team/dashboard");
        }
      }
    }

    return { success: false, error: "Invalid email or password." };
  } catch (err: any) {
    if (err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Team SignIn error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function teamLogOutAction() {
  await clearTeamSessionCookie();
  redirect("/team/login");
}

export async function verifyJoinCodeAction(joinCode: string) {
  if (!joinCode || !joinCode.trim()) {
    return { success: false, error: "Please enter an invite code." };
  }

  try {
    const code = joinCode.toUpperCase().trim();
    const team = await prisma.team.findUnique({
      where: { joinCode: code },
      select: {
        id: true,
        teamName: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return { success: false, error: "Invalid invite code. Team not found." };
    }

    // Maximum 5 members per team (1 lead + 4 members)
    if (team._count.members >= 4) {
      return { success: false, error: "This team has already reached maximum capacity (5 members)." };
    }

    return { success: true, teamId: team.id, teamName: team.teamName };
  } catch (err) {
    console.error("verifyJoinCodeAction error:", err);
    return { success: false, error: "Failed to verify invite code." };
  }
}

export async function joinTeamAction(prevState: any, formData: FormData) {
  const fullName = (formData.get("fullName") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string || "";
  const teamId = (formData.get("teamId") as string || "").trim();

  const googleId = (formData.get("googleId") as string || "").trim() || null;
  const avatarUrl = (formData.get("avatarUrl") as string || "").trim() || null;

  if (!fullName || !email || !teamId) {
    return { success: false, error: "Missing required fields." };
  }

  if (!googleId && !password) {
    return { success: false, error: "Password is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (password && password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    // 1. Verify team and check capacity
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return { success: false, error: "Team not found." };
    }

    if (team._count.members >= 4) {
      return { success: false, error: "This team has already reached maximum capacity (5 members)." };
    }

    const existingMember = await prisma.teamMember.findUnique({ where: { email } });
    const existingLead = await prisma.team.findUnique({ where: { email } });

    if (existingMember || existingLead) {
      return { success: false, error: "Email is already registered for a team or member." };
    }

    const googleId = (formData.get("googleId") as string || "").trim() || null;
    const avatarUrl = (formData.get("avatarUrl") as string || "").trim() || null;
    const authProvider = googleId ? "google" : "credentials";
    const passwordHash = password ? hashPassword(password) : null;

    const member = await prisma.teamMember.create({
      data: {
        fullName,
        email,
        passwordHash,
        googleId,
        authProvider,
        avatarUrl,
        teamId,
      },
    });

    await prisma.message.create({
      data: {
        content: `System added ${fullName} (Team Member) to the console.`,
        channelId: "general",
        senderName: "System",
        senderAvatar: "SYS",
        senderRole: "System",
        teamId: teamId,
        hackathonId: team.hackathonId,
      },
    });

    await setTeamSessionCookie(member.id);
  } catch (err: any) {
    if (err.digest && err.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("joinTeamAction error:", err);
    return { success: false, error: "Failed to join team. Please try again." };
  }

  redirect("/team/dashboard");
}

