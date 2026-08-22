"use client";

import { useState, useTransition } from "react";
import { selectTeamProblemStatement } from "../../../actions/problem-statement-actions";
import { FileText, CheckCircle2, ExternalLink, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";

interface ProblemStatement {
  id: string;
  title: string;
  track: string;
  description: string;
  difficulty: string | null;
  pdfUrl: string | null;
  resourceUrl: string | null;
}

interface TeamProblemStatementsViewProps {
  statements: ProblemStatement[];
  currentSelectedId: string | null;
  isTeamLead: boolean;
  teamName: string;
}

export default function TeamProblemStatementsView({
  statements,
  currentSelectedId: initialSelectedId,
  isTeamLead,
  teamName,
}: TeamProblemStatementsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (statementId: string) => {
    if (!isTeamLead) {
      toast.error("Only Team Leads can select or lock in the problem statement.");
      return;
    }

    const isUnselecting = selectedId === statementId;
    const targetId = isUnselecting ? null : statementId;

    startTransition(async () => {
      const res = await selectTeamProblemStatement(targetId);
      if (res.success) {
        setSelectedId(targetId);
        toast.success(
          targetId
            ? "Problem statement locked in for your team!"
            : "Problem statement selection cleared."
        );
      } else {
        toast.error(res.error || "Failed to update team problem statement.");
      }
    });
  };

  const selectedStatement = statements.find((s) => s.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E61E32]" />
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Event Problem Statements
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Review event tracks & challenge briefs. Team Leads can lock in the official statement for <span className="text-zinc-900 font-bold">{teamName}</span>.
          </p>
        </div>

        {selectedStatement ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Locked In Statement</p>
              <p className="text-emerald-950 font-bold">{selectedStatement.track}: {selectedStatement.title}</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No Problem Statement Locked In Yet</span>
          </div>
        )}
      </div>

      {statements.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
          <FileText className="w-10 h-10 text-zinc-300" />
          <h3 className="text-sm font-bold text-zinc-800">No Problem Statements Published Yet</h3>
          <p className="text-xs text-zinc-500 max-w-md">
            The hackathon organizers have not published problem statements yet. Please check back soon or watch the event announcements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {statements.map((ps) => {
            const isSelected = selectedId === ps.id;
            return (
              <div
                key={ps.id}
                className={`bg-white border rounded-xl p-6 shadow-sm transition-all space-y-4 ${
                  isSelected
                    ? "border-[#E61E32] ring-2 ring-[#E61E32]/10 bg-gradient-to-br from-white to-red-50/20"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#E61E32] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded">
                        {ps.track}
                      </span>
                      {ps.difficulty && (
                        <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded">
                          Difficulty: {ps.difficulty}
                        </span>
                      )}
                      {isSelected && (
                        <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Selected by your Team
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-zinc-900 pt-1">{ps.title}</h2>
                  </div>

                  {isTeamLead ? (
                    <button
                      onClick={() => handleSelect(ps.id)}
                      disabled={isPending}
                      className={`px-5 py-2 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 ${
                        isSelected
                          ? "bg-zinc-900 hover:bg-black text-white"
                          : "bg-[#E61E32] hover:bg-[#c91527] text-white"
                      }`}
                    >
                      {isSelected ? (
                        <>Clear Choice</>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Lock In for Team
                        </>
                      )}
                    </button>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
                      Locked by Team Lead
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-zinc-700 font-normal leading-relaxed whitespace-pre-line bg-zinc-50 border border-zinc-150 p-4 rounded-lg">
                  {ps.description}
                </p>

                {(ps.pdfUrl || ps.resourceUrl) && (
                  <div className="flex items-center gap-6 text-xs font-bold pt-2 border-t border-zinc-100">
                    {ps.pdfUrl && (
                      <a
                        href={ps.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#E61E32] hover:underline flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        Download Problem Brief (PDF)
                      </a>
                    )}
                    {ps.resourceUrl && (
                      <a
                        href={ps.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-800 hover:text-black hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4 text-zinc-500" />
                        Starter Kit / Resources
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
