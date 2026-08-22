"use client";

import { useState, useTransition } from "react";
import {
  createProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  ProblemStatementData,
} from "../../../../actions/problem-statement-actions";
import { Plus, Trash2, Edit2, FileText, ExternalLink, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ProblemStatement {
  id: string;
  title: string;
  track: string;
  description: string;
  difficulty: string | null;
  pdfUrl: string | null;
  resourceUrl: string | null;
  teams?: { id: string; teamName: string }[];
}

interface ProblemStatementManagerProps {
  hackathonId: string;
  problemStatements: ProblemStatement[];
}

export default function ProblemStatementManager({
  hackathonId,
  problemStatements: initialStatements,
}: ProblemStatementManagerProps) {
  const [statements, setStatements] = useState<ProblemStatement[]>(initialStatements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProblemStatementData>({
    title: "",
    track: "AI & ML",
    description: "",
    difficulty: "Medium",
    pdfUrl: "",
    resourceUrl: "",
  });

  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      track: "AI & ML",
      description: "",
      difficulty: "Medium",
      pdfUrl: "",
      resourceUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ps: ProblemStatement) => {
    setEditingId(ps.id);
    setFormData({
      title: ps.title,
      track: ps.track,
      description: ps.description,
      difficulty: ps.difficulty || "Medium",
      pdfUrl: ps.pdfUrl || "",
      resourceUrl: ps.resourceUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.track.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields (title, track, description).");
      return;
    }

    startTransition(async () => {
      if (editingId) {
        const res = await updateProblemStatement(editingId, formData);
        if (res.success && res.problemStatement) {
          setStatements((prev) =>
            prev.map((s) => (s.id === editingId ? { ...s, ...res.problemStatement } : s))
          );
          toast.success("Problem statement updated!");
          setIsModalOpen(false);
        } else {
          toast.error(res.error || "Failed to update problem statement.");
        }
      } else {
        const res = await createProblemStatement(hackathonId, formData);
        if (res.success && res.problemStatement) {
          setStatements((prev) => [...prev, res.problemStatement]);
          toast.success("Problem statement created successfully!");
          setIsModalOpen(false);
        } else {
          toast.error(res.error || "Failed to create problem statement.");
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this problem statement?")) return;
    startTransition(async () => {
      const res = await deleteProblemStatement(id);
      if (res.success) {
        setStatements((prev) => prev.filter((s) => s.id !== id));
        toast.success("Problem statement deleted.");
      } else {
        toast.error(res.error || "Failed to delete problem statement.");
      }
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E61E32]" />
            Hackathon Problem Statements & Tracks
          </h3>
          <p className="text-[11px] text-zinc-500 font-normal mt-0.5">
            Publish event problem statements for team leads and participants to choose from.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#E61E32] hover:bg-[#c91527] text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Problem Statement
        </button>
      </div>

      {statements.length === 0 ? (
        <div className="border border-dashed border-zinc-250 rounded-lg p-10 text-center flex flex-col items-center justify-center space-y-3">
          <FileText className="w-8 h-8 text-zinc-300" />
          <h4 className="text-xs font-bold text-zinc-800">No Problem Statements Published</h4>
          <p className="text-zinc-500 text-[11px] max-w-sm">
            Create problem statements for your hackathon tracks so team leads can review and select them during the event.
          </p>
          <button
            onClick={handleOpenCreate}
            className="py-1.5 px-3 border border-zinc-300 rounded bg-white text-zinc-800 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
          >
            Create First Statement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {statements.map((ps) => (
            <div
              key={ps.id}
              className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#E61E32] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                      {ps.track}
                    </span>
                    {ps.difficulty && (
                      <span className="bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        Difficulty: {ps.difficulty}
                      </span>
                    )}
                    {ps.teams && ps.teams.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Selected by {ps.teams.length} team(s)
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 pt-1">{ps.title}</h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(ps)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded bg-white cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ps.id)}
                    disabled={isPending}
                    className="p-1.5 text-zinc-400 hover:text-[#E61E32] border border-zinc-200 rounded bg-white cursor-pointer disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-650 font-normal leading-relaxed whitespace-pre-line bg-white border border-zinc-200 p-3 rounded-md">
                {ps.description}
              </p>

              {(ps.pdfUrl || ps.resourceUrl) && (
                <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                  {ps.pdfUrl && (
                    <a
                      href={ps.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E61E32] hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Problem Brief (PDF)
                    </a>
                  )}
                  {ps.resourceUrl && (
                    <a
                      href={ps.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-700 hover:text-zinc-950 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Starter Kit / Resources
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-lg p-6 max-w-xl w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-200 pb-3">
              {editingId ? "Edit Problem Statement" : "Add Problem Statement"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">Track Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Machine Learning, Web3, FinTech, Open Innovation"
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">Problem Statement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Early Flood Detection System"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Difficulty Rating</label>
                  <select
                    value={formData.difficulty || "Medium"}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Resource / Starter Kit URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formData.resourceUrl || ""}
                    onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
                    className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">PDF Attachment / Brief URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://..."
                  value={formData.pdfUrl || ""}
                  onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">Problem Description & Requirements *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe the background problem, objectives, expected deliverables, and technical criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded text-zinc-900 outline-none focus:border-[#E61E32] resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-[#E61E32] hover:bg-[#c91527] text-white rounded font-bold cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingId ? "Save Changes" : "Create Statement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
