import { getSessionUser } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import SupportChatConsole from "../../../../components/SupportChatConsole";

export default async function OrganizerChatPage() {
  const organizer = await getSessionUser();
  if (!organizer) redirect("/sign-in");

  // Get all hackathons belonging to this organizer
  const hackathons = await prisma.hackathon.findMany({
    where: { organizerId: organizer.id },
    select: { id: true },
  });

  const hackathonIds = hackathons.map((h) => h.id);

  // Fetch all competing teams across these hackathons
  const teams = await prisma.team.findMany({
    where: { hackathonId: { in: hackathonIds } },
    include: {
      members: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { teamName: "asc" },
  });

  return (
    <main className="p-6 md:p-8 w-full space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Live Support Chat Sync</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Monitor and reply directly to private team squad chatboxes and support inquiries.
        </p>
      </div>

      <SupportChatConsole teams={teams} currentUserRole="Organizer" />
    </main>
  );
}
