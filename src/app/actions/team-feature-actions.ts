"use server";

import { prisma } from "../../lib/db";
import { getSessionTeam } from "../../lib/auth";

// ── Messages Server Actions ──

export interface ChatContactItem {
  id: string;
  name: string;
  role: string;
  email: string | null;
  avatarUrl: string | null;
  type: "teammate" | "judge";
}

export async function fetchChatContactsAction(): Promise<{ squad: ChatContactItem[]; judges: ChatContactItem[] }> {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  // 1. Fetch Squad Members
  const squadLead: ChatContactItem = {
    id: team.id,
    name: team.teamLeadName,
    role: "Team Lead",
    email: team.email,
    avatarUrl: team.avatarUrl,
    type: "teammate",
  };

  const squadMembers: ChatContactItem[] = (team.members || []).map((m: any) => ({
    id: m.id,
    name: m.fullName,
    role: "Teammate",
    email: m.email,
    avatarUrl: m.avatarUrl,
    type: "teammate",
  }));

  // 2. Fetch Hackathon Judges / Mentors
  const judges = await prisma.judge.findMany({
    where: { hackathonId: team.hackathonId },
    select: { id: true, name: true, imageUrl: true, description: true },
    orderBy: { name: "asc" },
  });

  const judgeContacts: ChatContactItem[] = judges.map((j) => ({
    id: j.id,
    name: j.name,
    role: "Judge / Mentor",
    email: null,
    avatarUrl: j.imageUrl,
    type: "judge",
  }));

  return {
    squad: [squadLead, ...squadMembers],
    judges: judgeContacts,
  };
}

export async function fetchMessagesAction(channelId: string, recipientId?: string) {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const cleanChannelId = (channelId || "team-squad").trim();
  const currentUserName = team.user.fullName;

  // 1. Direct 1-on-1 Private Message
  if (cleanChannelId.startsWith("dm_") || recipientId) {
    return prisma.message.findMany({
      where: {
        hackathonId: team.hackathonId,
        isPrivate: true,
        OR: [
          { channelId: cleanChannelId },
          ...(recipientId
            ? [
                { senderName: currentUserName, recipientId: recipientId },
                { senderId: recipientId, recipientName: currentUserName },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  // 2. Team Squad Private Channel (strictly visible to members of team.id only)
  if (cleanChannelId === "team-squad" || cleanChannelId === "general") {
    return prisma.message.findMany({
      where: {
        teamId: team.id,
        channelId: cleanChannelId,
        isPrivate: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  // 3. Public Hackathon Channel (announcements, public-general, tech-support)
  return prisma.message.findMany({
    where: {
      hackathonId: team.hackathonId,
      channelId: cleanChannelId,
      isPrivate: false,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function sendMessageAction(
  content: string,
  channelId: string,
  recipientId?: string,
  recipientName?: string
) {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const cleanContent = (content || "").trim();
  const cleanChannelId = (channelId || "team-squad").trim();

  if (!cleanContent) {
    throw new Error("Message content cannot be empty.");
  }

  if (cleanContent.length > 2000) {
    throw new Error("Message exceeds maximum allowed length of 2000 characters.");
  }

  const isDm = cleanChannelId.startsWith("dm_") || !!recipientId;
  const isSquad = !isDm && (cleanChannelId === "team-squad" || cleanChannelId === "general");

  const message = await prisma.message.create({
    data: {
      content: cleanContent,
      channelId: cleanChannelId,
      senderId: team.isLead ? team.id : team.user.email,
      senderName: team.user.fullName,
      senderAvatar: team.user.avatarUrl || team.user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase(),
      senderRole: team.isLead ? "Team Lead" : "Team Member",
      recipientId: isDm ? (recipientId || null) : null,
      recipientName: isDm ? (recipientName || null) : null,
      isPrivate: isDm,
      teamId: isSquad ? team.id : isDm ? team.id : null,
      hackathonId: team.hackathonId,
    },
  });

  return message;
}

// ── Jury Consultation Server Actions ──

export async function fetchJudgesAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  return prisma.judge.findMany({
    where: {
      hackathonId: team.hackathonId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function requestJuryConsultationAction(
  judgeId: string,
  type: string,
  notes: string
) {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const cleanJudgeId = (judgeId || "").trim();
  const cleanType = (type || "Technical Critique").trim();
  const cleanNotes = (notes || "").trim() || null;

  // Verify that the judge belongs to the team's hackathon
  const judge = await prisma.judge.findUnique({
    where: { id: cleanJudgeId },
  });

  if (!judge || judge.hackathonId !== team.hackathonId) {
    throw new Error("Unauthorized: Judge is not part of this hackathon.");
  }

  const request = await prisma.juryRequest.create({
    data: {
      type: cleanType,
      notes: cleanNotes,
      judgeId: cleanJudgeId,
      teamId: team.id,
      status: "Pending",
    },
  });

  return request;
}

export async function fetchJuryRequestsAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  return prisma.juryRequest.findMany({
    where: {
      teamId: team.id,
    },
    include: {
      judge: true,
    },
    orderBy: {
      requestedAt: "desc",
    },
  });
}

// ── Ideation Server Actions ──

export async function fetchIdeaAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  return prisma.idea.findUnique({
    where: {
      teamId: team.id,
    },
  });
}

export async function saveIdeaAction(
  problem: string,
  solution: string,
  targetAudience: string,
  feasibilityScore: number,
  marketFitScore: number,
  complexity: string
) {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const cleanProblem = (problem || "").trim();
  const cleanSolution = (solution || "").trim();
  const cleanTargetAudience = (targetAudience || "").trim();
  const cleanFeasibility = Math.max(0, Math.min(100, Math.round(Number(feasibilityScore) || 0)));
  const cleanMarketFit = Math.max(0, Math.min(100, Math.round(Number(marketFitScore) || 0)));
  const cleanComplexity = (complexity || "Medium").trim();

  const idea = await prisma.idea.upsert({
    where: {
      teamId: team.id,
    },
    create: {
      problem: cleanProblem,
      solution: cleanSolution,
      targetAudience: cleanTargetAudience,
      feasibilityScore: cleanFeasibility,
      marketFitScore: cleanMarketFit,
      complexity: cleanComplexity,
      teamId: team.id,
    },
    update: {
      problem: cleanProblem,
      solution: cleanSolution,
      targetAudience: cleanTargetAudience,
      feasibilityScore: cleanFeasibility,
      marketFitScore: cleanMarketFit,
      complexity: cleanComplexity,
    },
  });

  return idea;
}

// ── Roast My Site Server Actions ──

export async function fetchProjectSubmissionAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  return prisma.projectSubmission.findUnique({
    where: {
      teamId: team.id,
    },
  });
}

export async function saveRoastAction(
  liveUrl: string,
  burnLevel: string,
  logsJson: string,
  verdict: string
) {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const cleanLiveUrl = (liveUrl || "").trim();
  const cleanBurnLevel = (burnLevel || "Medium").trim();
  const cleanLogsJson = (logsJson || "[]").trim();
  const cleanVerdict = (verdict || "Audited").trim();

  const roast = await prisma.projectRoast.create({
    data: {
      liveUrl: cleanLiveUrl,
      burnLevel: cleanBurnLevel,
      logsJson: cleanLogsJson,
      verdict: cleanVerdict,
      teamId: team.id,
    },
  });

  return roast;
}

export async function fetchRoastsAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  return prisma.projectRoast.findMany({
    where: {
      teamId: team.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function fetchChannelMessageCountsAction() {
  const team = await getSessionTeam();
  if (!team) {
    throw new Error("Unauthorized: Team session not found.");
  }

  const counts = await prisma.message.groupBy({
    by: ["channelId"],
    where: {
      hackathonId: team.hackathonId,
    },
    _count: {
      id: true,
    },
  });

  return counts.map((c) => ({
    channelId: c.channelId,
    count: c._count.id,
  }));
}

export async function getCurrentUserAction() {
  const team = await getSessionTeam();
  if (!team) return null;
  return {
    fullName: team.user.fullName,
    email: team.user.email,
    avatarUrl: team.user.avatarUrl,
  };
}

export async function fetchTopNavbarCountsAction() {
  const team = await getSessionTeam();
  if (!team) {
    return { messages: 0, jury: 0, roast: 0 };
  }

  const messageCount = await prisma.message.count({
    where: {
      hackathonId: team.hackathonId,
    },
  });

  const juryCount = await prisma.juryRequest.count({
    where: {
      teamId: team.id,
    },
  });

  const roastCount = await prisma.projectRoast.count({
    where: {
      teamId: team.id,
    },
  });

  return {
    messages: messageCount,
    jury: juryCount,
    roast: roastCount,
  };
}

