import crypto from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "hackos_secure_platform_secret_key_change_in_production_2026";
const SESSION_COOKIE_NAME = "hackos_session";
const TEAM_SESSION_COOKIE_NAME = "hackos_team_session";
const JUDGE_SESSION_COOKIE_NAME = "hackos_judge_session";
const MENTOR_SESSION_COOKIE_NAME = "hackos_mentor_session";

// ── Password Hashing & Verification (PBKDF2 SHA-512) ──
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2_100k:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== "string") return false;

  try {
    if (storedHash.startsWith("pbkdf2_100k:")) {
      const parts = storedHash.split(":");
      if (parts.length !== 3) return false;
      const salt = parts[1];
      const originalHash = parts[2];
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
      return crypto.timingSafeEqual(Buffer.from(hash, "utf-8"), Buffer.from(originalHash, "utf-8"));
    }

    // Legacy format support: salt:hash (1000 iterations)
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    if (hash.length !== originalHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash, "utf-8"), Buffer.from(originalHash, "utf-8"));
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

// ── Cryptographic Session Token Signing (HMAC-SHA256) ──
function signSessionToken(role: "organizer" | "team" | "judge" | "mentor", id: string): string {
  const issuedAt = Date.now().toString();
  const payload = `v1:${role}:${id}:${issuedAt}`;
  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${payload}:${signature}`;
}

function verifySessionToken(token: string, expectedRole: "organizer" | "team" | "judge" | "mentor"): string | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(":");
    if (parts.length !== 5) return null;
    const [version, role, id, issuedAt, signature] = parts;

    if (version !== "v1" || role !== expectedRole || !id || !issuedAt || !signature) {
      return null;
    }

    const payload = `v1:${role}:${id}:${issuedAt}`;
    const hmac = crypto.createHmac("sha256", AUTH_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedSigBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
      return null;
    }

    return id;
  } catch (err) {
    console.error("Session verification error:", err);
    return null;
  }
}

// ── Organizer Session Management ──
export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const signedToken = signSessionToken("organizer", userId);
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: signedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value, "organizer");
}

export const getSessionUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  try {
    const user = await prisma.organizer.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch session user:", error);
    return null;
  }
});

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ── Team Session Management ──
export async function setTeamSessionCookie(teamOrMemberId: string) {
  const cookieStore = await cookies();
  const signedToken = signSessionToken("team", teamOrMemberId);
  cookieStore.set({
    name: TEAM_SESSION_COOKIE_NAME,
    value: signedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSessionTeamId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TEAM_SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value, "team");
}

export const getSessionTeam = cache(async () => {
  const teamIdOrMemberId = await getSessionTeamId();
  if (!teamIdOrMemberId) return null;

  try {
    // 1. Check if session ID belongs to a Team (Team Lead)
    const team = await prisma.team.findUnique({
      where: { id: teamIdOrMemberId },
      include: {
        hackathon: true,
        members: true,
      },
    });

    if (team) {
      return {
        ...team,
        isLead: true,
        user: { fullName: team.teamLeadName, email: team.email, avatarUrl: team.avatarUrl },
      };
    }

    // 2. Check if session ID belongs to a TeamMember
    const member = await prisma.teamMember.findUnique({
      where: { id: teamIdOrMemberId },
      include: {
        team: {
          include: {
            hackathon: true,
            members: true,
          },
        },
      },
    });

    if (member) {
      return {
        ...member.team,
        isLead: false,
        user: { fullName: member.fullName, email: member.email, avatarUrl: member.avatarUrl },
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch session team/member:", error);
    return null;
  }
});

export async function clearTeamSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TEAM_SESSION_COOKIE_NAME);
}

// ── Judge Session Management ──
export async function setJudgeSessionCookie(judgeId: string) {
  const cookieStore = await cookies();
  const signedToken = signSessionToken("judge", judgeId);
  cookieStore.set({
    name: JUDGE_SESSION_COOKIE_NAME,
    value: signedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSessionJudgeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(JUDGE_SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value, "judge");
}

export const getSessionJudge = cache(async () => {
  const judgeId = await getSessionJudgeId();
  if (!judgeId) return null;

  try {
    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: {
        hackathon: {
          select: { id: true, title: true },
        },
      },
    });
    return judge;
  } catch (error) {
    console.error("Failed to fetch session judge:", error);
    return null;
  }
});

export async function clearJudgeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(JUDGE_SESSION_COOKIE_NAME);
}

// ── Mentor Session Management ──
export async function setMentorSessionCookie(mentorId: string) {
  const cookieStore = await cookies();
  const signedToken = signSessionToken("mentor", mentorId);
  cookieStore.set({
    name: MENTOR_SESSION_COOKIE_NAME,
    value: signedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSessionMentorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(MENTOR_SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value, "mentor");
}

export const getSessionMentor = cache(async () => {
  const mentorId = await getSessionMentorId();
  if (!mentorId) return null;

  try {
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        hackathon: {
          select: { id: true, title: true },
        },
      },
    });
    return mentor;
  } catch (error) {
    console.error("Failed to fetch session mentor:", error);
    return null;
  }
});

export async function clearMentorSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(MENTOR_SESSION_COOKIE_NAME);
}



