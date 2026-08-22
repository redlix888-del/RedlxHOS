"use client";

import React, { useState } from "react";
import { 
  GitBranch, 
  Globe, 
  ExternalLink, 
  UploadCloud, 
  Users, 
  Shield, 
  Megaphone,
  Mail,
  User,
  Home,
  Laptop
} from "lucide-react";

interface Member {
  id: string;
  fullName: string;
  email: string;
}

interface Team {
  id: string;
  teamName: string;
  teamLeadName: string;
  email: string;
  members: Member[];
}

interface Submission {
  id: string;
  teamId: string;
  projectName: string | null;
  description: string | null;
  githubUrl: string;
  liveUrl: string | null;
  submittedAt: Date;
  team: {
    teamName: string;
    teamLeadName: string;
    email: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface Guideline {
  id: string;
  content: string;
}

interface Mentor {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  expertise: string | null;
  hackathon: {
    id: string;
    title: string;
  };
}

interface MentorConsoleProps {
  mentor: Mentor;
  submissions: Submission[];
  teams: Team[];
  announcements: Announcement[];
  guidelines: Guideline[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function MentorConsole({
  mentor,
  submissions,
  teams,
  announcements,
  guidelines,
}: MentorConsoleProps) {
  const [activeTab, setActiveTab] = useState<"home" | "submissions" | "teams" | "messages" | "profile" >("home");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const selectedTeamSubmission = selectedTeam ? submissions.find(s => s.teamId === selectedTeam.id) : undefined;

  const tabs = [
    { id: "home", name: "Home", count: null },
    { id: "submissions", name: "Submissions", count: submissions.length },
    { id: "teams", name: "Teams", count: teams.length },
    { id: "messages", name: "Announcements", count: announcements.length },
    { id: "profile", name: "Profile", count: null },
  ] as const;

  return (
    <div className="flex flex-col flex-1">
      {/* SubNavbar */}
      <nav className="w-full bg-white border-b border-zinc-200 px-6 flex items-center gap-6 text-sm font-semibold tracking-tight shadow-sm shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none shrink-0 ${
                isActive
                  ? "border-[#E61E32] text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {tab.id === "home" && <Home className="w-3.5 h-3.5" />}
              <span>{tab.name}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                  isActive ? "bg-red-50 text-[#E61E32] border border-red-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <div className="p-6 md:p-8 w-full max-w-[1500px] mx-auto flex-grow">
        
        {/* Render Tab Contents */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-in fade-in duration-150 w-full">
            <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">Hackathon Rubrics & Info</h3>
            
            <div className="bg-white border border-zinc-300 rounded-none p-6 shadow-sm space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                <Laptop className="w-4 h-4 text-[#E61E32]" />
                <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">Evaluation Guidelines & Frameworks</h4>
              </div>

              {guidelines.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-zinc-400 font-semibold">No judging guidelines configured for this event yet.</p>
                </div>
              ) : (
                <ul className="space-y-3 w-full">
                  {guidelines.map((g, idx) => (
                    <li 
                      key={g.id}
                      className="flex items-start gap-3.5 text-xs text-zinc-650 bg-zinc-50 p-4 border border-zinc-200/60 rounded-none w-full"
                    >
                      <span className="font-extrabold text-[#E61E32] text-sm shrink-0 mt-0.5">{idx + 1}.</span>
                      <span className="leading-relaxed font-normal text-zinc-655">{g.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">Project Deliverables</h3>
            
            {submissions.length === 0 ? (
              <div className="bg-white border border-zinc-300 rounded-none p-16 text-center shadow-sm">
                <UploadCloud className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-zinc-500">No project submissions yet</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Once participating teams submit their code or slides, they will display instantly here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white border border-zinc-300 border-l-4 border-l-[#E61E32] rounded-none shadow-sm flex flex-col justify-between overflow-hidden hover:border-zinc-400 transition-all"
                  >
                    <div>
                      {/* Header */}
                      <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="text-xs font-bold text-zinc-800 truncate">
                            {sub.team.teamName}
                          </span>
                        </div>
                        <span className="shrink-0 text-[8px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-none">
                          Delivered
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-4">
                        {sub.projectName && (
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{sub.projectName}</p>
                            {sub.description && (
                              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 border-t border-b border-zinc-100 py-3">
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Team Lead</p>
                            <p className="text-xs font-semibold text-zinc-700 mt-0.5">{sub.team.teamLeadName}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Contact</p>
                            <p className="text-xs font-semibold text-zinc-700 mt-0.5 truncate">{sub.team.email}</p>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href={sub.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-none px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            GitHub Repository
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                          </a>
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 text-zinc-800 rounded-none px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Globe className="w-3.5 h-3.5 text-zinc-500" />
                              Live Demo / Deck
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-150">
            
            {/* Teams Navigation Panel */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">Competing Teams</h3>
              <div className="bg-white border border-zinc-300 rounded-none shadow-sm divide-y divide-zinc-200 max-h-[600px] overflow-y-auto">
                {teams.map((t, idx) => {
                  const isSelected = selectedTeam?.id === t.id;
                  const hasSubmitted = submissions.some(s => s.teamId === t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeam(t)}
                      className={`w-full text-left p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-4 cursor-pointer focus:outline-none ${
                        isSelected ? "bg-zinc-50 border-r-4 border-r-[#E61E32]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400 font-bold font-mono">#{String(idx + 1).padStart(2, "0")}</span>
                          <span className="text-xs font-extrabold text-zinc-850 truncate">{t.teamName}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-1">Lead: {t.teamLeadName}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSubmitted ? (
                          <span className="text-[7.5px] font-extrabold uppercase bg-emerald-50 border border-emerald-250 text-emerald-700 px-1.5 py-0.5 rounded-none shrink-0">
                            Submitted
                          </span>
                        ) : (
                          <span className="text-[7.5px] font-extrabold uppercase bg-zinc-50 border border-zinc-200 text-zinc-400 px-1.5 py-0.5 rounded-none shrink-0">
                            Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Team Profile & Details */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">Team Information</h3>

              {selectedTeam ? (
                <div className="bg-white border border-zinc-300 rounded-none p-6 shadow-sm space-y-6">
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
                    <div>
                      <h4 className="text-lg font-extrabold text-zinc-950">{selectedTeam.teamName}</h4>
                      <p className="text-xs text-zinc-400 font-semibold mt-0.5">Contact: {selectedTeam.email}</p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      Roster ({selectedTeam.members.length + 1} Members)
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Team Lead card */}
                      <div className="border border-zinc-200 bg-zinc-50 p-3 flex items-center gap-3 rounded-none">
                        <div className="w-8 h-8 rounded-none bg-[#E61E32] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {selectedTeam.teamLeadName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-800 truncate">{selectedTeam.teamLeadName}</p>
                          <p className="text-[9px] font-extrabold text-[#E61E32] uppercase mt-0.5 tracking-wider">Team Lead</p>
                        </div>
                      </div>

                      {/* Members list cards */}
                      {selectedTeam.members.map((member) => (
                        <div key={member.id} className="border border-zinc-200 bg-white p-3 flex items-center gap-3 rounded-none">
                          <div className="w-8 h-8 rounded-none bg-zinc-250 border border-zinc-350 text-zinc-500 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 truncate">{member.fullName}</p>
                            <p className="text-[9px] font-extrabold text-zinc-400 uppercase mt-0.5 tracking-wider">Developer</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission detail display */}
                  <div className="space-y-3 border-t border-zinc-150 pt-5">
                    <h5 className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                      Submission Details
                    </h5>

                    {selectedTeamSubmission ? (
                      <div className="bg-zinc-50 border border-zinc-200 p-4 space-y-4 rounded-none">
                        {selectedTeamSubmission.projectName && (
                          <div>
                            <h6 className="text-xs font-extrabold text-zinc-900">{selectedTeamSubmission.projectName}</h6>
                            {selectedTeamSubmission.description && (
                              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{selectedTeamSubmission.description}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1.5">
                          <a
                            href={selectedTeamSubmission.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-none px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            Repository
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                          </a>
                          {selectedTeamSubmission.liveUrl && (
                            <a
                              href={selectedTeamSubmission.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-none px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Globe className="w-3.5 h-3.5 text-zinc-500" />
                              Live Demo
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 font-semibold italic bg-zinc-50 p-4 border border-zinc-200 text-center rounded-none">
                        No submissions uploaded yet by this team.
                      </p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-dashed border-zinc-300 rounded-none p-16 text-center shadow-sm">
                  <Users className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-500">No team selected</p>
                  <p className="text-[11px] text-zinc-400 mt-1">Select a team from the panel on the left to see their profile.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">Organizer Announcements</h3>
            
            {announcements.length === 0 ? (
              <div className="bg-white border border-zinc-300 rounded-none p-16 text-center shadow-sm">
                <Megaphone className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-[#E61E32]">No updates posted yet</p>
                <p className="text-[11px] text-zinc-400 mt-1">Check back later for announcements and alerts from the hackathon organizers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-300 rounded-none p-5 shadow-sm space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <h4 className="text-xs font-extrabold text-zinc-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-[#E61E32]" />
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-bold font-mono">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-650 leading-relaxed font-normal whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="font-extrabold text-zinc-550 text-xs uppercase tracking-wider">My Mentor Account</h3>
            
            <div className="bg-white border border-zinc-300 rounded-none p-6 shadow-sm max-w-2xl space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-500 font-bold shrink-0 uppercase overflow-hidden text-lg">
                  {mentor.imageUrl ? (
                    <img src={mentor.imageUrl} alt={mentor.name} className="w-full h-full object-cover" />
                  ) : (
                    mentor.name.charAt(0)
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-zinc-950">{mentor.name}</h4>
                    {mentor.expertise && (
                      <span className="text-[8px] font-extrabold text-[#E61E32] uppercase bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-none">
                        {mentor.expertise}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-semibold">{mentor.description}</p>
                </div>
              </div>

              <div className="border-t border-zinc-150 pt-5 space-y-3">
                <h5 className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  Privileges & Role Details
                </h5>

                <div className="bg-zinc-50 border border-zinc-200 p-4 text-xs leading-relaxed space-y-2 rounded-none">
                  <p className="font-normal text-zinc-600">
                    You are registered as a **Mentor** for the event **{mentor.hackathon.title}**.
                  </p>
                  <ul className="list-disc pl-4 text-zinc-550 font-normal space-y-1 mt-2">
                    <li>Access to browse all registered teams and their team rosters.</li>
                    <li>Read-only access to deliverable links (GitHub repositories and live demonstration decks).</li>
                    <li>Receive priority real-time announcements from the organizer console.</li>
                    <li>No evaluation or scoring capabilities assigned to this role.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
