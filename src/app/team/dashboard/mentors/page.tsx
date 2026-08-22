import { getSessionTeam } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";
import TeamMentorsManager from "./TeamMentorsManager";
import { Award } from "lucide-react";

export default async function TeamMentorsPage() {
  const team = await getSessionTeam();
  if (!team) redirect("/team/login");

  // Fetch mentors assigned to this hackathon
  const mentors = await prisma.mentor.findMany({
    where: {
      hackathonId: team.hackathonId,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch judges assigned to this hackathon
  const judges = await prisma.judge.findMany({
    where: {
      hackathonId: team.hackathonId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="flex-grow p-6 md:p-8 max-w-[1400px] w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <section className="bg-white border border-zinc-200 rounded-none p-5 shadow-sm flex flex-col justify-between items-start gap-1">
        <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-[#E61E32]" />
          Hackathon Support Network
        </span>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
          Mentors & Technical Experts
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5 leading-relaxed max-w-2xl">
          Connect with official event mentors, industry experts, and hackathon judges assigned to your event. Request architecture reviews or direct 1-on-1 consultations.
        </p>
      </section>

      {/* Interactive Mentors Manager Grid */}
      <TeamMentorsManager mentors={mentors} judges={judges} />

    </main>
  );
}
