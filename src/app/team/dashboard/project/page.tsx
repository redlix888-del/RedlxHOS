import { getSessionTeam } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import ProjectSubmissionForm from "./ProjectSubmissionForm";

export default async function TeamProjectPage() {
  const team = await getSessionTeam();
  if (!team) redirect("/team/login");

  const submission = await prisma.projectSubmission.findUnique({
    where: { teamId: team.id },
  });

  return (
    <main className="flex-grow p-6 md:p-10 max-w-[1400px] w-full space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Project Submission</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Submit your idea and project repository for{" "}
          <span className="font-semibold text-zinc-700">{team.hackathon.title}</span>
        </p>
      </div>

      {/* Requirements strip */}
      <div className="flex flex-wrap items-center gap-0 border border-zinc-200 bg-white divide-x divide-zinc-200 w-fit">
        {[
          { label: "Idea submission via form", required: true },
          { label: "Public GitHub repository", required: true },
          { label: "Live deployment URL", required: false },
          { label: "Project name & description", required: false },
        ].map(({ label, required }) => (
          <div key={label} className="flex items-center gap-2 px-4 py-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                required ? "bg-[#E61E32]" : "bg-zinc-400"
              }`}
            />
            <span className="text-[11px] font-semibold text-zinc-600">{label}</span>
            {required ? (
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#E61E32]">Required</span>
            ) : (
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Optional</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Idea Submission — Google Form ── */}
      <div className="bg-white border border-zinc-200 shadow-sm">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold block mb-0.5">
              Step 1 &middot; Required
            </span>
            <h3 className="text-sm font-bold text-zinc-900">Idea Submission</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Officially register your team&apos;s idea for{" "}
              <span className="font-semibold text-zinc-700">{team.hackathon.title}</span> using the Google Form below.
            </p>
          </div>
          <a
            href="https://forms.gle/MJCz4CQyb7iNkSPJ8"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-[#E61E32] hover:bg-[#c91527] text-white text-[11px] font-bold px-4 py-2 border border-[#c91527] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in new tab
          </a>
        </div>

        {/* Embedded Google Form */}
        <div className="w-full">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSdOjjfbomIyuqyXc6wCE4JI4hfY-mzM4KXkEVHpXMYXPaDiDg/viewform?embedded=true"
            width="100%"
            height="700"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            className="block w-full"
            title="HackOS Idea Submission Form"
            loading="lazy"
          >
            Loading form…
          </iframe>
        </div>
      </div>

      {/* ── Step 2: Project / Code Submission ── */}
      <div className="space-y-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold block mb-0.5">
            Step 2 &middot; Required
          </span>
          <h3 className="text-sm font-bold text-zinc-900">Project &amp; Code Submission</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Submit your GitHub repository link and optional live demo URL below.
          </p>
        </div>

        <ProjectSubmissionForm
          teamId={team.id}
          hackathonId={team.hackathonId}
          hackathonTitle={team.hackathon.title}
          initialSubmission={submission}
        />
      </div>
    </main>
  );
}
