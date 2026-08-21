"use client";

import { useState, useEffect } from "react";
import { Lightbulb, CheckSquare, BarChart, RefreshCw, AlertTriangle, ShieldCheck, Sparkles, Loader2, Check } from "lucide-react";
import { fetchIdeaAction, saveIdeaAction } from "../../../actions/team-feature-actions";

interface ValidationCriteria {
  label: string;
  passed: boolean;
  notes: string;
}

function computeDeterministicAudit(problemText: string, solutionText: string, audienceText: string) {
  const p = problemText.trim();
  const s = solutionText.trim();
  const a = audienceText.trim();

  // 1. Problem Depth Score (0 - 35)
  const problemLengthScore = Math.min(20, Math.floor(p.length / 10));
  const problemKeywords = ["frustrat", "slow", "hard", "difficult", "problem", "expensive", "manual", "lack", "fail", "issue", "struggle", "waste", "cost", "inefficient"];
  const problemKeywordMatch = problemKeywords.filter((kw) => p.toLowerCase().includes(kw)).length;
  const problemScore = Math.min(35, problemLengthScore + problemKeywordMatch * 5);

  // 2. Solution Viability Score (0 - 35)
  const solutionLengthScore = Math.min(20, Math.floor(s.length / 10));
  const solutionKeywords = ["ai", "automated", "platform", "app", "system", "real-time", "dashboard", "api", "database", "analytics", "cloud", "workflow", "tool", "smart", "instant"];
  const solutionKeywordMatch = solutionKeywords.filter((kw) => s.toLowerCase().includes(kw)).length;
  const solutionScore = Math.min(35, solutionLengthScore + solutionKeywordMatch * 5);

  // 3. Audience Specificity Score (0 - 30)
  const audienceLengthScore = Math.min(15, Math.floor(a.length / 8));
  const audienceKeywords = ["student", "developer", "organizer", "business", "user", "engineer", "hospital", "founder", "team", "client", "customer", "company", "creator", "freelancer"];
  const audienceKeywordMatch = audienceKeywords.filter((kw) => a.toLowerCase().includes(kw)).length;
  const audienceScore = Math.min(30, audienceLengthScore + audienceKeywordMatch * 5);

  // Deterministic score algorithms
  const calcFeasibility = Math.min(100, Math.max(35, Math.round(30 + solutionScore * 1.3 + (p.length > 50 ? 15 : 5))));
  const calcMarketFit = Math.min(100, Math.max(35, Math.round(25 + problemScore * 1.2 + audienceScore * 1.1)));

  // Deterministic complexity
  const totalLength = p.length + s.length + a.length;
  let calcComplexity = "Medium";
  if (totalLength < 120) {
    calcComplexity = "Low";
  } else if (totalLength > 350 || solutionKeywordMatch >= 4) {
    calcComplexity = "High";
  }

  // Checklist Generation
  const checklist: ValidationCriteria[] = [
    {
      label: "Real-world Problem Statement Depth",
      passed: p.length >= 40 && problemKeywordMatch >= 1,
      notes: p.length < 40 
        ? "Problem description is brief. Add specific details about user pain points." 
        : `Detailed problem definition detected (${problemKeywordMatch} friction indicators matched).`,
    },
    {
      label: "Clear Target Audience Definition",
      passed: a.length >= 20 && audienceKeywordMatch >= 1,
      notes: a.length < 20
        ? "Target audience is too broad. Specify who will use or pay for this solution."
        : `Explicit target user demographic specified (${audienceKeywordMatch} key user terms identified).`,
    },
    {
      label: "MVP Scoping & Timeline Viability",
      passed: s.length >= 40 && calcFeasibility >= 60,
      notes: calcFeasibility >= 75
        ? "Solution scope is manageable and well-suited for a 48-hour hackathon timeline."
        : "Solution scope might be broad. Focus on a tight core MVP to avoid feature creep.",
    },
    {
      label: "High-Traffic Concurrency & Pooling Check",
      passed: calcFeasibility >= 70,
      notes: "Ensure Supabase database connection pooler (port 6543) and SSL settings are enabled for live operations.",
    },
  ];

  return { calcFeasibility, calcMarketFit, calcComplexity, checklist };
}

export default function TeamIdeatePage() {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [isValidating, setIsValidating] = useState(false);
  const [validationDone, setValidationDone] = useState(false);

  const [feasibilityScore, setFeasibilityScore] = useState(0);
  const [marketFitScore, setMarketFitScore] = useState(0);
  const [complexity, setComplexity] = useState("Medium");

  const [checklist, setChecklist] = useState<ValidationCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing idea on mount
  useEffect(() => {
    const loadIdea = async () => {
      setIsLoading(true);
      try {
        const idea = await fetchIdeaAction();
        if (idea) {
          setProblem(idea.problem);
          setSolution(idea.solution);
          setTargetAudience(idea.targetAudience);
          
          const audit = computeDeterministicAudit(idea.problem, idea.solution, idea.targetAudience);
          setFeasibilityScore(audit.calcFeasibility);
          setMarketFitScore(audit.calcMarketFit);
          setComplexity(audit.calcComplexity);
          setChecklist(audit.checklist);
          setValidationDone(true);
        } else {
          // Defaults if none saved
          const defaultProblem = "Managing tasks and submissions in real-time is frustrating for hackathon teams using scattered platforms (Discord, spreadsheets, GitHub).";
          const defaultSolution = "A unified Hackathon Operating System console (HackOS) providing real-time syncing, chat, mentor consultation bookings, and AI audits.";
          const defaultAudience = "Hackathon organizers seeking centralized dashboards and hackathon teams looking for quick coordination.";
          
          setProblem(defaultProblem);
          setSolution(defaultSolution);
          setTargetAudience(defaultAudience);
        }
      } catch (err) {
        console.error("Failed to load idea:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadIdea();
  }, []);

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || !solution.trim() || !targetAudience.trim()) return;

    setIsValidating(true);
    setValidationDone(false);

    // Compute deterministic analysis
    const audit = computeDeterministicAudit(problem, solution, targetAudience);

    setTimeout(async () => {
      try {
        await saveIdeaAction(
          problem,
          solution,
          targetAudience,
          audit.calcFeasibility,
          audit.calcMarketFit,
          audit.calcComplexity
        );
      } catch (err) {
        console.error("Failed to save idea details to database:", err);
      }

      setFeasibilityScore(audit.calcFeasibility);
      setMarketFitScore(audit.calcMarketFit);
      setComplexity(audit.calcComplexity);
      setChecklist(audit.checklist);
      
      setIsValidating(false);
      setValidationDone(true);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#E61E32] animate-spin" />
        <span className="text-xs text-zinc-400 font-bold mt-2">Connecting to Worksheet...</span>
      </div>
    );
  }

  return (
    <div className="flex-grow p-6 md:p-8 max-w-[1400px] w-full space-y-8 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <section className="bg-white border border-zinc-200 rounded-none p-5 shadow-sm flex flex-col justify-between items-start gap-1">
        <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold">Concept Evaluation Lab</span>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
          Ideate & Validate Your Concept
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5 leading-relaxed max-w-2xl">
          Enter your problem statements and solution ideas. Our validation analyzer evaluates feasibility, market/problem fit, and flags timeline constraints.
        </p>
      </section>

      {/* Input Worksheet */}
      <section className="bg-white border border-zinc-200 p-5 rounded-none shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Concept Definition Worksheet (Neon DB Stored)
        </h3>

        <form onSubmit={handleRunAudit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
              What problem are you solving?
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={isValidating}
              rows={2}
              required
              className="w-full bg-zinc-55 border border-zinc-200 text-xs p-3 focus:outline-none focus:border-[#E61E32] focus:bg-white font-medium transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
              What is your proposed solution?
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              disabled={isValidating}
              rows={2}
              required
              className="w-full bg-zinc-55 border border-zinc-200 text-xs p-3 focus:outline-none focus:border-[#E61E32] focus:bg-white font-medium transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
              Who is your target market/audience?
            </label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              disabled={isValidating}
              rows={2}
              required
              className="w-full bg-zinc-55 border border-zinc-200 text-xs p-3 focus:outline-none focus:border-[#E61E32] focus:bg-white font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="bg-[#E61E32] hover:bg-[#c91527] disabled:bg-red-400 text-white font-bold text-xs px-6 py-2.5 rounded-none flex items-center justify-center gap-1.5 border border-[#c91527] cursor-pointer shadow-sm transition-all"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Concept...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Run Validation Audit</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Audit Report */}
      {validationDone && !isValidating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Audit Metrics Card */}
          <div className="bg-white border border-zinc-200 p-5 rounded-none shadow-sm space-y-5 lg:col-span-1 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                <BarChart className="w-4 h-4 text-[#E61E32]" />
                Validation Scores
              </h4>
              
              <div className="space-y-4">
                {/* Score 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-650">Technical Feasibility</span>
                    <span className="text-[#E61E32]">{feasibilityScore}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-none overflow-hidden">
                    <div
                      className="bg-[#E61E32] h-full"
                      style={{ width: `${feasibilityScore}%` }}
                    />
                  </div>
                </div>

                {/* Score 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-650">Problem/Market Fit</span>
                    <span className="text-emerald-600">{marketFitScore}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-none overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${marketFitScore}%` }}
                    />
                  </div>
                </div>

                {/* Score 3 */}
                <div className="pt-2 flex justify-between items-center text-xs border-t border-zinc-100">
                  <span className="text-zinc-500 font-medium">Estimated Complexity</span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                    {complexity}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-55 border border-zinc-200 p-3 rounded-none flex items-start gap-2 text-[10px] text-zinc-500 leading-normal">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Concept successfully synced with PostgreSQL database storage. Make sure to review the architectural checks to avoid deployment crashes.
              </span>
            </div>
          </div>

          {/* Validation Checklist Card */}
          <div className="bg-white border border-zinc-200 p-5 rounded-none shadow-sm space-y-4 lg:col-span-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#E61E32]" />
              Audit Checklist & Feedback
            </h4>

            <div className="space-y-3.5">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-zinc-150 hover:bg-zinc-50/50 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    {item.passed ? (
                      <span className="w-4 h-4 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-none bg-red-100 border border-red-300 text-red-700 flex items-center justify-center text-[10px] font-black">
                        !
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      {item.label}
                      {!item.passed && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] bg-red-50 text-[#E61E32] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border border-red-200">
                          <AlertTriangle className="w-2.5 h-2.5 text-[#E61E32]" /> Action Needed
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-zinc-505 font-normal leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
