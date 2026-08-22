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

  if (cleanChannelId === "announcements") {
    throw new Error("Only Hackathon Organizers can broadcast messages in announcements.");
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

// ── Real-Time Website Audit Action ──
export async function analyzeRealtimeWebsiteAction(targetUrl: string) {
  let url = (targetUrl || "").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const logs: { type: "info" | "warning" | "burn" | "success"; text: string }[] = [];
  logs.push({ type: "info", text: `[INIT] Dispatching HTTP GET probe to target: ${url}` });

  const startTime = Date.now();
  let statusCode = 0;
  let htmlContent = "";
  let isReachable = false;
  let latencyMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HackOS-Roaster/2.0 (+https://hackos.io)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    latencyMs = Date.now() - startTime;
    statusCode = response.status;
    isReachable = response.ok || statusCode < 400;
    htmlContent = await response.text();
  } catch (err: any) {
    latencyMs = Date.now() - startTime;
    logs.push({
      type: "burn",
      text: `[NET_ERR] Failed to reach site (${err.message || "Connection Timeout / Refused"}). Latency: ${latencyMs}ms.`,
    });
  }

  if (!isReachable) {
    logs.push({
      type: "burn",
      text: `[HTTP_STATUS] Target server returned status ${statusCode || "UNREACHABLE"}. Is your app running or deployed?`,
    });
    logs.push({
      type: "burn",
      text: `[CRITIQUE] Your site is harder to find than an offline server in 1999. Fix your deployment!`,
    });
    logs.push({
      type: "success",
      text: `[COMPLETE] Audit finished. Overall Verdict: Site offline or returning error status. Score: 1.5/10.`,
    });

    return {
      score: 1.5,
      burnLevel: "Inferno (Extra Spicy 🌶️🔥)",
      verdict: "Target server unreachable or returning HTTP errors. Score: 1.5/10.",
      logs,
    };
  }

  // --- Real HTML Analysis ---
  logs.push({
    type: "info",
    text: `[HTTP_STATUS] Connected (200 OK). Server latency: ${latencyMs}ms. Page payload size: ${(htmlContent.length / 1024).toFixed(1)} KB.`,
  });

  // SSL Check
  const isHttps = url.startsWith("https://");
  if (isHttps) {
    logs.push({ type: "info", text: `[SECURITY] SSL Encryption verified (HTTPS active).` });
  } else {
    logs.push({ type: "warning", text: `[SECURITY] Insecure protocol (HTTP). Browsers will warn users!` });
  }

  // Latency Evaluation
  if (latencyMs < 350) {
    logs.push({ type: "info", text: `[PERF] Lightning fast response time (${latencyMs}ms). Edge CDN hosting detected!` });
  } else if (latencyMs < 1200) {
    logs.push({ type: "info", text: `[PERF] Acceptable response time (${latencyMs}ms). Standard cloud latency.` });
  } else {
    logs.push({ type: "burn", text: `[PERF] Slow load time (${latencyMs}ms). Your database query or bundle size is dragging.` });
  }

  // Title Extraction
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  if (pageTitle) {
    logs.push({ type: "info", text: `[SEO] Found page title: "${pageTitle}"` });
  } else {
    logs.push({ type: "warning", text: `[SEO] Missing <title> tag! Search engines and browser tabs will show untitled.` });
  }

  // Meta Description
  const metaDescMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          htmlContent.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : "";
  if (metaDesc) {
    logs.push({ type: "info", text: `[SEO] Meta description present (${metaDesc.length} chars).` });
  } else {
    logs.push({ type: "burn", text: `[SEO] Missing meta description! Link previews on Twitter/WhatsApp will look broken.` });
  }

  // Mobile Viewport
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(htmlContent);
  if (hasViewport) {
    logs.push({ type: "info", text: `[UX] Mobile viewport meta tag verified.` });
  } else {
    logs.push({ type: "burn", text: `[UX] Missing viewport meta tag! Your site will look like a tiny desktop site on mobile phones.` });
  }

  // Headings & Elements Count
  const h1Count = (htmlContent.match(/<h1[^>]*>/gi) || []).length;
  const imgMatches = htmlContent.match(/<img[^>]*>/gi) || [];
  const imgCount = imgMatches.length;
  const imgsWithoutAlt = imgMatches.filter(img => !/alt=["'][^"']+["']/i.test(img)).length;
  const buttonCount = (htmlContent.match(/<button[^>]*>/gi) || []).length;
  const linkCount = (htmlContent.match(/<a[^>]*>/gi) || []).length;

  logs.push({
    type: "info",
    text: `[DOM] Parsed structure: ${h1Count} H1 header(s), ${imgCount} image(s), ${buttonCount} button(s), ${linkCount} link(s).`,
  });

  if (imgCount > 0 && imgsWithoutAlt > 0) {
    logs.push({
      type: "burn",
      text: `[ACCESSIBILITY] ${imgsWithoutAlt} out of ${imgCount} image(s) missing alt text! Screen readers can't read them.`,
    });
  }

  // Tech Stack Detection
  const lowerHtml = htmlContent.toLowerCase();
  const detectedTech: string[] = [];
  if (lowerHtml.includes("next/") || lowerHtml.includes("__next")) detectedTech.push("Next.js");
  if (lowerHtml.includes("react")) detectedTech.push("React");
  if (lowerHtml.includes("tailwind")) detectedTech.push("Tailwind CSS");
  if (lowerHtml.includes("vue")) detectedTech.push("Vue.js");
  if (lowerHtml.includes("bootstrap")) detectedTech.push("Bootstrap");

  if (detectedTech.length > 0) {
    logs.push({ type: "info", text: `[TECH] Detected stack signatures: ${detectedTech.join(", ")}.` });
  }

  // --- Dynamic Score Calculation ---
  let score = 5.0;

  if (isHttps) score += 0.5;
  if (latencyMs < 350) score += 1.5;
  else if (latencyMs < 1000) score += 0.8;
  else if (latencyMs > 2500) score -= 1.0;

  if (pageTitle && pageTitle.length > 5) score += 1.0;
  else score -= 0.5;

  if (metaDesc && metaDesc.length > 15) score += 1.0;
  else score -= 0.8;

  if (hasViewport) score += 0.8;
  else score -= 1.2;

  if (h1Count >= 1 && h1Count <= 2) score += 0.5;
  if (imgCount === 0 || imgsWithoutAlt === 0) score += 0.5;
  else if (imgsWithoutAlt > 0) score -= 0.5;

  if (detectedTech.length >= 2) score += 0.4;

  score = Math.max(2.0, Math.min(9.7, Math.round(score * 10) / 10));

  let burnLevel = "Mild (Clean & Crisp)";
  if (score < 4.5) burnLevel = "Inferno (Extra Spicy 🌶️🔥)";
  else if (score < 7.0) burnLevel = "Scorch (Spicy 🔥)";

  let verdict = `Real-time analysis complete! Score: ${score}/10. Latency: ${latencyMs}ms.`;
  if (score >= 8.0) {
    verdict = `Impressive performance & structural setup (${score}/10). Responsive load in ${latencyMs}ms with valid SEO tags.`;
  } else if (score >= 6.0) {
    verdict = `Decent website build (${score}/10). Fix missing meta descriptions & image alt tags to boost ranking.`;
  } else {
    verdict = `Needs serious polish (${score}/10). High latency (${latencyMs}ms) or missing essential SEO & mobile viewport tags.`;
  }

  logs.push({
    type: "success",
    text: `[COMPLETE] Audit finished. Final Score: ${score}/10. ${verdict}`,
  });

  return {
    score,
    burnLevel,
    verdict,
    logs,
  };
}

