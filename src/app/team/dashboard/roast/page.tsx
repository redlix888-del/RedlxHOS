"use client";

import { useState, useEffect } from "react";
import { Flame, Terminal, Play, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Loader2, CheckSquare } from "lucide-react";
import { fetchProjectSubmissionAction, saveRoastAction, fetchRoastsAction, analyzeRealtimeWebsiteAction } from "../../../actions/team-feature-actions";

interface RoastLog {
  type: "info" | "warning" | "burn" | "success";
  text: string;
}

interface HistoricalRoast {
  id: string;
  liveUrl: string;
  verdict: string;
  burnLevel: string;
  createdAt: Date;
}

export default function TeamRoastPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastDone, setRoastDone] = useState(false);
  const [logs, setLogs] = useState<RoastLog[]>([]);
  const [burnLevel, setBurnLevel] = useState("Mild");
  const [verdict, setVerdict] = useState("");
  
  const [history, setHistory] = useState<HistoricalRoast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const submission = await fetchProjectSubmissionAction();
      if (submission) {
        setSiteUrl(submission.liveUrl || "");
        setProjectName(submission.projectName || "");
        setProjectDescription(submission.description || "");
      }
      
      const roasts = await fetchRoastsAction();
      setHistory(
        roasts.map((r) => ({
          id: r.id,
          liveUrl: r.liveUrl,
          verdict: r.verdict,
          burnLevel: r.burnLevel,
          createdAt: new Date(r.createdAt),
        }))
      );
    } catch (err) {
      console.error("Error loading project submission or roasts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteUrl.trim()) return;

    setIsRoasting(true);
    setRoastDone(false);
    setLogs([]);

    try {
      // Execute real-time server-side HTTP probe and HTML audit
      const auditResult = await analyzeRealtimeWebsiteAction(siteUrl);

      const dynamicLogs = auditResult.logs;
      const calculatedBurn = auditResult.burnLevel;
      const calculatedVerdict = auditResult.verdict;

      let currentLogIndex = 0;
      const interval = setInterval(async () => {
        if (currentLogIndex < dynamicLogs.length) {
          const logToAppend = dynamicLogs[currentLogIndex];
          setLogs((prev) => [...prev, logToAppend]);
          currentLogIndex++;
        } else {
          clearInterval(interval);
          
          try {
            // Save roast to PostgreSQL database
            const saved = await saveRoastAction(
              siteUrl,
              calculatedBurn,
              JSON.stringify(dynamicLogs),
              calculatedVerdict
            );
            
            setHistory((prev) => [
              {
                id: saved.id,
                liveUrl: saved.liveUrl,
                verdict: saved.verdict,
                burnLevel: saved.burnLevel,
                createdAt: new Date(saved.createdAt),
              },
              ...prev,
            ]);
          } catch (err) {
            console.error("Failed to save roast:", err);
          }

          setBurnLevel(calculatedBurn);
          setVerdict(calculatedVerdict);
          setIsRoasting(false);
          setRoastDone(true);
        }
      }, 350);
    } catch (err) {
      console.error("Error executing real-time website roast:", err);
      setIsRoasting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#E61E32] animate-spin" />
        <span className="text-xs text-zinc-400 font-bold mt-2">Loading Project Data...</span>
      </div>
    );
  }

  return (
    <div className="flex-grow p-6 md:p-8 max-w-[1400px] w-full space-y-8 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <section className="bg-white border border-zinc-200 rounded-none p-5 shadow-sm flex flex-col justify-between items-start gap-1">
        <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold">Gamified Design Audit</span>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
          Roast My Site (AI Console)
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5 leading-relaxed max-w-2xl">
          Submit your live website or project URL for a humorous and critical evaluation of your design, UX choices, and codebase performance.
        </p>
      </section>

      {/* Link Submission */}
      <section className="bg-white border border-zinc-200 p-5 rounded-none shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          Enter Your Project URL
        </h3>
        
        {!siteUrl && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 font-semibold mb-2">
            Note: You haven't submitted a project or live URL in the "Project Submission" page yet. We recommend setting one up there first, or you can test by typing below.
          </div>
        )}

        <form onSubmit={handleStartRoast} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            disabled={isRoasting}
            required
            placeholder="https://your-hackathon-project.vercel.app"
            className="flex-1 bg-zinc-50 border border-zinc-200 text-xs px-4 py-2.5 rounded-none font-semibold focus:outline-none focus:border-[#E61E32] focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isRoasting}
            className="bg-[#E61E32] hover:bg-[#c91527] disabled:bg-red-400 text-white font-bold text-xs px-6 py-2.5 rounded-none flex items-center justify-center gap-1.5 border border-[#c91527] cursor-pointer shadow-sm transition-all shrink-0"
          >
            {isRoasting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Roast My Site</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Terminal Roast Console */}
      {(isRoasting || logs.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#E61E32]" />
              Audit Console Logs
            </h3>
            
            {roastDone && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                <Flame className="w-3.5 h-3.5 text-[#E61E32] animate-bounce" />
                <span>Burn Level: {burnLevel}</span>
              </div>
            )}
          </div>

          {/* Terminal Component */}
          <div className="bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-[11px] p-5 shadow-2xl rounded-none relative overflow-hidden select-none">
            <div className="flex gap-1.5 mb-4 shrink-0 pb-3 border-b border-zinc-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div className="space-y-3.5 min-h-[220px] max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
              <div className="text-zinc-500">
                $ hackos-audit --target={siteUrl}
              </div>
              <div className="text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Initializing HackOS roasting engine...</span>
              </div>

              {logs.map((log, idx) => {
                const getLogColor = (type: RoastLog["type"]) => {
                  switch (type) {
                    case "info": return "text-zinc-400";
                    case "warning": return "text-amber-400";
                    case "burn": return "text-red-400 font-bold";
                    case "success": return "text-emerald-400 font-bold";
                  }
                };
                return (
                  <div key={idx} className={`leading-relaxed animate-in slide-in-from-bottom-2 fade-in duration-300 ${getLogColor(log.type)}`}>
                    {log.text}
                  </div>
                );
              })}
              
              {isRoasting && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-3.5 bg-zinc-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none">
              <ShieldAlert className="w-48 h-48 text-white" />
            </div>
          </div>
        </section>
      )}

      {/* Historical Roasts */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#E61E32]" />
          Audit History
        </h3>
        
        {history.length > 0 ? (
          <div className="bg-white border border-zinc-200 rounded-none shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-500 text-[10px] uppercase tracking-wider">
                  <th className="p-3">Audit Date</th>
                  <th className="p-3">Target URL</th>
                  <th className="p-3">Burn Severity</th>
                  <th className="p-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium text-zinc-700">
                {history.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50">
                    <td className="p-3 font-semibold">
                      {r.createdAt.toLocaleDateString()} {r.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-mono text-zinc-650 max-w-[200px] truncate">{r.liveUrl}</td>
                    <td className="p-3">
                      <span className="bg-red-50 border border-red-200 text-red-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                        {r.burnLevel}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500 font-normal leading-relaxed">{r.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 p-8 text-center text-xs text-zinc-400 font-semibold shadow-sm">
            No previous website roasts have been logged for this team.
          </div>
        )}
      </section>

    </div>
  );
}
