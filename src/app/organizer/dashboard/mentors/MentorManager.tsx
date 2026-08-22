"use client";

import React, { useState, useTransition } from "react";
import { 
  addMentor, 
  deleteMentor, 
  generateMentorAccessCode 
} from "../../../actions/mentor-actions";
import { 
  Trash2, 
  Plus, 
  AlertCircle, 
  User, 
  Loader2, 
  Key, 
  Copy, 
  Check, 
  ExternalLink 
} from "lucide-react";

interface Hackathon {
  id: string;
  title: string;
}

interface Mentor {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  expertise: string | null;
  loginCode: string | null;
  loginCodeExpiresAt: Date | null;
  hackathonId: string;
  hackathon: {
    title: string;
  };
}

interface MentorManagerProps {
  hackathons: Hackathon[];
  initialMentors: Mentor[];
}

export default function MentorManager({
  hackathons,
  initialMentors,
}: MentorManagerProps) {
  const [selectedHackathonId, setSelectedHackathonId] = useState(hackathons[0]?.id || "");
  
  const filteredMentors = initialMentors.filter((m) => m.hackathonId === selectedHackathonId);
  
  // Mentor Form State
  const [mentorName, setMentorName] = useState("");
  const [mentorDesc, setMentorDesc] = useState("");
  const [mentorImg, setMentorImg] = useState("");
  const [mentorExpertise, setMentorExpertise] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId || !mentorName.trim() || !mentorDesc.trim()) return;

    setMessage(null);
    startTransition(async () => {
      const res = await addMentor(selectedHackathonId, mentorName, mentorDesc, mentorImg, mentorExpertise);
      if (res.success) {
        setMessage({ type: "success", text: `Mentor "${mentorName}" added successfully!` });
        setMentorName("");
        setMentorDesc("");
        setMentorImg("");
        setMentorExpertise("");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to add mentor." });
      }
    });
  };

  const handleDeleteMentor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove mentor "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteMentor(id);
      if (res.success) {
        setMessage({ type: "success", text: "Mentor removed successfully." });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to remove mentor." });
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Target Hackathon Selector */}
      <div className="bg-white border border-zinc-300 rounded-none p-5 shadow-sm max-w-xl">
        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Configure Target Hackathon</label>
        {hackathons.length > 0 ? (
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-none px-3 py-2 text-xs text-zinc-888 focus:outline-none focus:border-zinc-500 font-semibold"
          >
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-55 p-2.5 rounded-none border border-amber-200 font-semibold">
            Please create a hackathon first before setting up mentors.
          </p>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-none text-xs font-semibold flex items-start gap-2 max-w-xl border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
              : "bg-red-50 border-red-250 text-red-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-current" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Form and List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Form: Add Mentor */}
        <div className="bg-white border border-zinc-300 rounded-none p-5 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
            <User className="w-4 h-4 text-[#E61E32]" strokeWidth={2.5} />
            <h3 className="font-bold text-zinc-950 text-xs uppercase tracking-wider">Add Mentor</h3>
          </div>

          <form onSubmit={handleAddMentor} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Mentor Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-none px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Expertise / Skills</label>
              <input
                type="text"
                placeholder="e.g. Next.js, FastAPI, NLP (comma separated)"
                value={mentorExpertise}
                onChange={(e) => setMentorExpertise(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-none px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Mentor Biography</label>
              <textarea
                required
                placeholder="e.g. Senior Software Engineer with expertise in building real-time collaboration tools."
                value={mentorDesc}
                onChange={(e) => setMentorDesc(e.target.value)}
                rows={3}
                className="w-full bg-white border border-zinc-300 rounded-none px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Avatar / Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={mentorImg}
                onChange={(e) => setMentorImg(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-none px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || hackathons.length === 0}
              className="w-full bg-[#E61E32] hover:bg-[#c91527] disabled:bg-zinc-300 text-white py-2 rounded-none text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Mentor
            </button>
          </form>
        </div>

        {/* Configured Mentors List */}
        <div className="space-y-3">
          <h3 className="font-bold text-zinc-550 text-xs uppercase tracking-wider">Configured Mentors</h3>
          
          {filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredMentors.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-zinc-300 border-l-4 border-l-[#E61E32] rounded-none p-4 shadow-sm flex flex-col justify-between relative group transition-all duration-200 hover:border-zinc-400"
                >
                  <button
                    onClick={() => handleDeleteMentor(m.id, m.name)}
                    className="absolute top-4 right-4 p-1.5 rounded-none border border-transparent hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove mentor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-none bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-500 font-bold shrink-0 uppercase overflow-hidden">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        m.name.charAt(0)
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-950 pr-8">{m.name}</h4>
                        {m.expertise && (
                          <span className="text-[8px] font-extrabold text-[#E61E32] uppercase bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-none">
                            {m.expertise}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-550 font-semibold leading-tight text-zinc-400 italic mb-1">{m.hackathon.title}</p>
                      <p className="text-xs text-zinc-500 font-normal leading-relaxed">{m.description}</p>
                    </div>
                  </div>

                  {/* 5-Min Mentor Login Access Code Generator */}
                  <MentorAccessCodeSection 
                    mentorId={m.id} 
                    initialCode={m.loginCode} 
                    initialExpiry={m.loginCodeExpiresAt} 
                  />

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-zinc-300 rounded-none p-10 text-center text-zinc-400 shadow-sm">
              <User className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">No mentors configured yet for this hackathon</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

/* Sub-component to manage active access codes and expiry count downs */
function MentorAccessCodeSection({ 
  mentorId, 
  initialCode, 
  initialExpiry 
}: { 
  mentorId: string; 
  initialCode: string | null; 
  initialExpiry: Date | null; 
}) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [expiry, setExpiry] = useState<Date | null>(initialExpiry ? new Date(initialExpiry) : null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!expiry || !code) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const diff = expiry.getTime() - Date.now();
      if (diff <= 0) {
        setCode(null);
        setExpiry(null);
        setTimeLeft("");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [code, expiry]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateMentorAccessCode(mentorId);
      if (res.success && res.code && res.expiresAt) {
        setCode(res.code);
        setExpiry(new Date(res.expiresAt));
      } else {
        alert(res.error || "Failed to generate access code.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = expiry ? expiry.getTime() <= Date.now() : true;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-150 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-zinc-400" />
          Mentor Login Access
        </span>
        {code && !isExpired && timeLeft && (
          <span className="text-[9px] text-[#E61E32] font-extrabold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-none uppercase tracking-wide">
            {timeLeft}
          </span>
        )}
      </div>

      {code && !isExpired ? (
        <div className="flex items-center gap-2">
          {/* Active Code Display */}
          <div className="flex-1 bg-zinc-50 border border-zinc-300 px-3 py-1.5 flex items-center justify-between text-xs font-bold font-mono tracking-widest text-zinc-800">
            <span>{code}</span>
            <button
              onClick={handleCopy}
              className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Open Login Page Link */}
          <a
            href="/mentor/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#E61E32] hover:bg-[#c91527] text-white font-bold p-2 text-xs flex items-center justify-center gap-1 border border-[#E61E32] transition-colors cursor-pointer shrink-0"
            title="Open Mentor Login Page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Login
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            {isGenerating ? "Generating..." : "Generate 5-Min Code"}
          </button>
          
          <a
            href="/mentor/login"
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 border border-zinc-300 hover:bg-zinc-55 text-zinc-650 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            Portal
          </a>
        </div>
      )}
    </div>
  );
}
