import { getSessionUser } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import DashboardTimerConfig from "./DashboardTimerConfig";

export default async function OrganizerDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch hackathons for this organizer along with their registered teams
  const hackathons = await prisma.hackathon.findMany({
    where: {
      organizerId: user.id,
    },
    include: {
      registrations: true,
      teams: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Header */}
      <section className="bg-white border border-zinc-300 rounded-none p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold block">Organizer Dashboard</span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
            Welcome back, {user.fullName}
          </h2>
        </div>
        
        <Link
          href="/organizer/dashboard/hackathons/create"
          className="bg-[#E61E32] hover:bg-[#c91527] text-white font-bold py-2 px-4 rounded-none text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Create New Hackathon
        </Link>
      </section>

      {/* Main Dashboard Widget: Active Timer Config & Status */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
            Hackathon Timer & Live Operations
          </h3>
        </div>
        
        {hackathons.length === 0 ? (
          <div className="bg-white border border-zinc-300 rounded-none p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
            <h4 className="text-sm font-bold text-zinc-900 mb-1">
              No Active Hackathons
            </h4>
            <p className="text-zinc-500 text-xs max-w-xs mb-5 font-normal leading-relaxed">
              You haven&apos;t created any hackathons yet. Get started by creating your first event today.
            </p>
            <Link
              href="/organizer/dashboard/hackathons/create"
              className="py-2 px-4 border border-zinc-350 hover:border-zinc-450 rounded-none bg-white text-zinc-800 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Create First Event
            </Link>
          </div>
        ) : (
          <DashboardTimerConfig hackathons={hackathons} />
        )}
      </section>

    </main>
  );
}
