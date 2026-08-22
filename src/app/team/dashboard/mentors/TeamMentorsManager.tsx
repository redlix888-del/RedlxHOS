"use client";

import { useState } from "react";
import { Search, UserCheck, MessageSquare, Award, Sparkles, BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Mentor {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  expertise: string | null;
}

interface Judge {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

interface Props {
  mentors: Mentor[];
  judges: Judge[];
}

export default function TeamMentorsManager({ mentors, judges }: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mentors" | "judges">("all");

  const allExperts = [
    ...mentors.map((m) => ({ ...m, role: "Mentor", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" })),
    ...judges.map((j) => ({ ...j, expertise: "Hackathon Judge", role: "Judge", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" })),
  ];

  const filtered = allExperts.filter((exp) => {
    if (filterType === "mentors" && exp.role !== "Mentor") return false;
    if (filterType === "judges" && exp.role !== "Judge") return false;

    const term = search.toLowerCase().trim();
    if (!term) return true;

    return (
      exp.name.toLowerCase().includes(term) ||
      exp.description.toLowerCase().includes(term) ||
      (exp.expertise && exp.expertise.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-[#E61E32] border border-[#c91527] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm rounded-none">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/80" />
          <input
            type="text"
            placeholder="Search mentors by name, role, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-white/20 rounded-none pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-white/60 bg-white/10 text-white placeholder-white/60"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterType === "all"
                ? "bg-white text-[#E61E32] border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            All Experts ({allExperts.length})
          </button>
          <button
            onClick={() => setFilterType("mentors")}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterType === "mentors"
                ? "bg-white text-[#E61E32] border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            Mentors ({mentors.length})
          </button>
          <button
            onClick={() => setFilterType("judges")}
            className={`px-3 py-1.5 text-xs font-bold transition-all border ${
              filterType === "judges"
                ? "bg-white text-[#E61E32] border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            Judges ({judges.length})
          </button>
        </div>
      </div>

      {/* Experts Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-none p-12 text-center flex flex-col items-center justify-center min-h-[250px] shadow-sm">
          <UserCheck className="w-10 h-10 text-zinc-300 mb-2" />
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            No Mentors Found
          </h3>
          <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
            {search ? "No mentor matches your search criteria." : "No mentors or judges have been registered for this hackathon yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exp) => {
            const initials = exp.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={exp.id}
                className="bg-white border border-zinc-200 p-5 rounded-none shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Bar with Avatar & Role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {exp.imageUrl ? (
                        <img
                          src={exp.imageUrl}
                          alt={exp.name}
                          className="w-11 h-11 rounded-full object-cover border border-zinc-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-none bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-[#E61E32] transition-colors">
                          {initials}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#E61E32] transition-colors leading-snug">
                          {exp.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-medium block">
                          {exp.role}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-none ${exp.badgeColor}`}>
                      {exp.expertise || exp.role}
                    </span>
                  </div>

                  {/* Description / Bio */}
                  <p className="text-[11px] text-zinc-600 font-normal leading-relaxed line-clamp-3 bg-zinc-50 border border-zinc-150 p-2.5">
                    {exp.description || "Official Hackathon Mentor available for technical guidance and pitch review."}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-zinc-150 flex items-center justify-between gap-2">
                  <Link
                    href="/team/dashboard/messages"
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] py-1.5 px-3 rounded-none flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Message</span>
                  </Link>

                  <Link
                    href="/team/dashboard/jury"
                    className="flex-1 bg-[#E61E32] hover:bg-[#c91527] text-white font-bold text-[11px] py-1.5 px-3 rounded-none flex items-center justify-center gap-1.5 border border-[#c91527] transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Book Review</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
