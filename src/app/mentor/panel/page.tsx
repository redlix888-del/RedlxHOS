import { getSessionMentor } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { UserCheck } from "lucide-react";
import LogoutButton from "./LogoutButton";
import MentorConsole from "./MentorConsole";

export default async function MentorPanelPage() {
  const mentor = await getSessionMentor();

  // Protect the panel page
  if (!mentor) {
    redirect("/mentor/login");
  }

  // Fetch all judging guidelines for this hackathon (useful for mentors to know rubric)
  const guidelines = await prisma.judgingGuideline.findMany({
    where: { hackathonId: mentor.hackathonId },
    select: { id: true, content: true },
    orderBy: { createdAt: "asc" },
  });

  // Fetch all project submissions for this hackathon
  const submissions = await prisma.projectSubmission.findMany({
    where: { hackathonId: mentor.hackathonId },
    include: {
      team: { select: { teamName: true, teamLeadName: true, email: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Fetch all competing teams for this hackathon
  const teams = await prisma.team.findMany({
    where: { hackathonId: mentor.hackathonId },
    include: {
      members: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { teamName: "asc" },
  });

  // Fetch all announcements for this hackathon
  const announcements = await prisma.announcement.findMany({
    where: { hackathonId: mentor.hackathonId },
    select: { id: true, title: true, content: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="w-full bg-[#E61E32] border-b border-[#c91527] px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-white text-lg tracking-tight">
          <span className="font-semibold text-white/80">HackOS Mentor Console</span>
          <span className="text-white/40 font-light">/</span>
          <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{mentor.hackathon.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-white/90 text-xs font-semibold">
            <UserCheck className="w-4 h-4 text-white/60" />
            <span>Mentor: {mentor.name}</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Interactive Mentor Dashboard Tabs Component */}
      <MentorConsole 
        mentor={mentor}
        submissions={submissions}
        teams={teams}
        announcements={announcements}
        guidelines={guidelines}
      />

    </div>
  );
}
