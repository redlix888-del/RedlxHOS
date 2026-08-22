import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, MapPin, Trophy, DollarSign, ExternalLink, Settings, Users, ArrowRight } from "lucide-react";

export default async function MyHackathonsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch hackathons for this organizer along with teams and their members
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
    <main className="p-6 md:p-8 w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Hosted Hackathons</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Create, launch, and review all hackathons hosted under your console.
          </p>
        </div>
        
        <Link
          href="/organizer/dashboard/hackathons/create"
          className="bg-[#E61E32] hover:bg-[#c91527] text-white font-bold py-2 px-4 rounded-none text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Create New Hackathon
        </Link>
      </header>

      {/* Hackathons List (Grid Layout) */}
      {hackathons.length === 0 ? (
        <div className="bg-white border border-zinc-300 rounded-none p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-none flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
            <Trophy className="w-6 h-6" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            No Events Created Yet
          </h3>
          <p className="text-zinc-500 text-xs max-w-xs mb-5 leading-relaxed">
            Get started by launching your first active or draft hackathon dashboard.
          </p>
          <Link
            href="/organizer/dashboard/hackathons/create"
            className="py-2 px-4 border border-zinc-300 hover:border-zinc-400 rounded-none bg-white text-zinc-800 text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
          {hackathons.map((hackathon) => {
            const startDate = new Date(hackathon.startDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const endDate = new Date(hackathon.endDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={hackathon.id}
                className="bg-white border border-zinc-300 rounded-none overflow-hidden hover:border-zinc-450 shadow-sm transition-all flex flex-col justify-between"
              >
                {/* Banner image with responsive overlay removed */}
                <div className="w-full relative bg-zinc-950 border-b border-zinc-200">
                  <img
                    src={hackathon.bannerUrl || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000"}
                    alt={hackathon.title}
                    className="w-full h-32 md:h-36 object-cover"
                  />
                </div>

                {/* Content Area */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    
                    {/* Tags underneath the image card */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-red-50 text-[#E61E32] border border-red-200 rounded-none tracking-wider">
                        {hackathon.tag}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-none border ${
                          hackathon.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : hackathon.status === "Draft"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {hackathon.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-950">
                      {hackathon.title}
                    </h3>
                    
                    <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed font-normal">
                      {hackathon.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2.5} />
                        {startDate} - {endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2.5} />
                        {hackathon.location}
                      </span>
                    </div>
                    
                    {/* Links Section (Ticketing & Location Link) */}
                    <div className="flex gap-3 text-[9px] uppercase font-extrabold tracking-wider pt-0.5">
                      {hackathon.locationLink && (
                        <a
                          href={hackathon.locationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E61E32] hover:text-[#c91527] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-[#E61E32]" strokeWidth={2.5} />
                          Map
                        </a>
                      )}
                      {hackathon.ticketingLink && (
                        <a
                          href={hackathon.ticketingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E61E32] hover:text-[#c91527] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-[#E61E32]" strokeWidth={2.5} />
                          Tickets
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Section with Actions and Stats */}
                <div className="bg-zinc-50 border-t border-zinc-200 p-4 space-y-3 shrink-0">
                  {/* Stats */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
                    <div>
                      <span className="uppercase tracking-wider">Registered Teams</span>
                      <span className="block text-sm font-extrabold text-zinc-800 tabular-nums">{hackathon.teams.length}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-zinc-200" />
                    <div className="text-right">
                      <span className="uppercase tracking-wider">Total Users</span>
                      <span className="block text-sm font-extrabold text-zinc-800 tabular-nums">
                        {hackathon.teams.reduce((sum, t) => sum + 1 + t._count.members, 0)}
                      </span>
                    </div>
                  </div>

                  {/* Console Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/organizer/dashboard/hackathons/${hackathon.id}`}
                      className="flex-grow py-2 px-3 bg-[#E61E32] hover:bg-[#c91527] text-white font-bold rounded-none text-center text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      Enter Console
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </Link>
                    
                    <Link
                      href={`/organizer/dashboard/hackathons/${hackathon.id}/edit`}
                      className="py-2 px-3 border border-zinc-300 hover:bg-white hover:border-zinc-400 bg-white text-zinc-700 font-bold rounded-none text-center text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.5} />
                      Edit
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
