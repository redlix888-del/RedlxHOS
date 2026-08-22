import { getSessionTeam } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import { Users } from "lucide-react";

export default async function TeamDetailsConsolePage() {
  const team = await getSessionTeam();

  if (!team) {
    redirect("/team/login");
  }

  // Fetch all teammates
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: team.id },
    select: { id: true, fullName: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  const totalMembers = teamMembers.length + 1; // +1 for lead

  return (
    <main className="flex-grow p-6 md:p-8 max-w-[1400px] w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">My Team</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Registered squad members on <span className="font-semibold text-zinc-700">{team.teamName}</span>
        </p>
      </div>

      {/* Team Members Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
            Active Squad Members
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 border border-zinc-200 bg-zinc-50 text-zinc-600 rounded-none">
            {totalMembers} of 5 Registered
          </span>
        </div>

        <div className="border border-zinc-300 overflow-x-auto shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-105 text-zinc-700 border-b border-zinc-300">
                <th className="text-left text-[10px] font-extrabold uppercase tracking-widest px-5 py-3.5 w-14 border-r border-zinc-200">
                  #
                </th>
                <th className="text-left text-[10px] font-extrabold uppercase tracking-widest px-5 py-3.5 border-r border-zinc-200">
                  Name
                </th>
                <th className="text-left text-[10px] font-extrabold uppercase tracking-widest px-5 py-3.5 border-r border-zinc-200">
                  Email
                </th>
                <th className="text-left text-[10px] font-extrabold uppercase tracking-widest px-5 py-3.5 w-28">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Team Lead (TL) */}
              <tr className="border-b border-zinc-200 bg-red-50">
                <td className="px-5 py-4 text-xs font-bold text-[#E61E32] border-r border-zinc-200">
                  1
                </td>
                <td className="px-5 py-4 border-r border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#E61E32] flex items-center justify-center text-xs font-extrabold text-white uppercase shrink-0">
                      {team.teamLeadName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-zinc-900">{team.teamLeadName}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-zinc-550 border-r border-zinc-200">
                  {team.email}
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E61E32] border border-red-200 bg-red-50 px-2.5 py-0.5">
                    TL
                  </span>
                </td>
              </tr>

              {/* Rows 2+: Teammates */}
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-zinc-400 text-xs bg-white">
                    No additional teammates joined yet.
                  </td>
                </tr>
              ) : (
                teamMembers.map((m, idx) => {
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-200 last:border-0 transition-colors bg-white hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-zinc-400 border-r border-zinc-200">
                        {idx + 2}
                      </td>
                      <td className="px-5 py-4 border-r border-zinc-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-200 border border-zinc-300 flex items-center justify-center text-xs font-extrabold text-zinc-600 uppercase shrink-0">
                            {m.fullName.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-zinc-900">{m.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-550 border-r border-zinc-200">
                        {m.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 border border-zinc-200 bg-zinc-50 px-2.5 py-0.5">
                          Member
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer banner */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-2.5 flex justify-between items-center">
            <p className="text-[10px] text-zinc-400 font-semibold">
              Invite Code for collaborators: <span className="font-mono text-zinc-700 font-bold ml-1">{team.joinCode}</span>
            </p>
            <p className="text-[10px] font-semibold text-zinc-550">
              Maximum squad size is 5 members.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
