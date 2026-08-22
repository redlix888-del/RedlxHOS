import { getSessionUser } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import MentorManager from "./MentorManager";

export default async function OrganizerMentorsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  const hackathons = await prisma.hackathon.findMany({
    where: { organizerId: user.id },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all mentors created by this organizer
  const mentors = await prisma.mentor.findMany({
    where: {
      hackathon: {
        organizerId: user.id,
      },
    },
    include: {
      hackathon: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-6 md:p-8 w-full space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Mentors Configuration</h2>
        <p className="text-sm text-zinc-500">Add experts to mentor panels, define their expertise, and manage access.</p>
      </div>

      <MentorManager
        hackathons={hackathons}
        initialMentors={mentors}
      />
    </main>
  );
}
