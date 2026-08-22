import { getSessionUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";
import { redirect, notFound } from "next/navigation";
import HackathonConsoleManager from "./HackathonConsoleManager";
import Link from "next/link";

interface HackathonConsolePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HackathonConsolePage({ params }: HackathonConsolePageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Fetch hackathon including prizes, faqs, and schedule items
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      id,
    },
    include: {
      prizes: true,
      faqs: true,
      scheduleItems: true,
      registrations: true,
      problemStatements: {
        include: {
          teams: true,
        },
      },
    },
  });

  // Verify existence and ownership
  if (!hackathon || hackathon.organizerId !== user.id) {
    notFound();
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <Link href="/organizer/dashboard/hackathons" className="hover:text-[#E61E32] transition-colors">
          My Hackathons
        </Link>
        <span>/</span>
        <span className="text-zinc-400 font-normal">Console Workspace</span>
        <span>/</span>
        <span className="text-zinc-800">{hackathon.title}</span>
      </div>

      <header className="border-b border-zinc-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900">
            {hackathon.title}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage event content, configure timelines, and resolve organizer queries.
          </p>
        </div>
        <Link
          href={`/organizer/dashboard/hackathons/${hackathon.id}/edit`}
          className="bg-zinc-150 hover:bg-zinc-200 text-zinc-800 font-semibold py-2 px-4 rounded text-xs transition-colors shadow-sm"
        >
          Edit Core Settings
        </Link>
      </header>

      <HackathonConsoleManager hackathon={hackathon} />
    </main>
  );
}
