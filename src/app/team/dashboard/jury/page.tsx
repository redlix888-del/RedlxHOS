"use client";

import { useState, useEffect } from "react";
import { Award, CheckCircle, Clock, Video, UserCheck, ShieldCheck, Sparkles, Loader2, X } from "lucide-react";
import { fetchJudgesAction, requestJuryConsultationAction, fetchJuryRequestsAction } from "../../../actions/team-feature-actions";

interface Judge {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

interface Request {
  id: string;
  type: string;
  judgeName: string;
  requestedAt: Date;
  status: string;
  notes: string | null;
}

export default function TeamJuryPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [reviewType, setReviewType] = useState("Technical Critique");
  const [notes, setNotes] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dbJudges = await fetchJudgesAction();
      const dbRequests = await fetchJuryRequestsAction();

      setJudges(dbJudges);
      setRequests(
        dbRequests.map((req) => ({
          id: req.id,
          type: req.type,
          judgeName: req.judge.name,
          requestedAt: new Date(req.requestedAt),
          status: req.status,
          notes: req.notes,
        }))
      );
    } catch (err) {
      console.error("Error loading jury data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudge) return;

    setIsSubmitting(true);
    try {
      await requestJuryConsultationAction(selectedJudge.id, reviewType, notes);
      setShowModal(false);
      setSelectedJudge(null);
      setNotes("");
      
      // Reload request history
      const dbRequests = await fetchJuryRequestsAction();
      setRequests(
        dbRequests.map((req) => ({
          id: req.id,
          type: req.type,
          judgeName: req.judge.name,
          requestedAt: new Date(req.requestedAt),
          status: req.status,
          notes: req.notes,
        }))
      );
    } catch (err) {
      console.error("Failed to request review:", err);
      alert("Failed to submit jury consultation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "Confirmed":
        return "bg-sky-50 text-sky-700 border-sky-250";
      default:
        return "bg-amber-50 text-amber-700 border-amber-250";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#E61E32] animate-spin" />
        <span className="text-xs text-zinc-400 font-bold mt-2">Loading Jury Database...</span>
      </div>
    );
  }

  return (
    <div className="flex-grow p-6 md:p-8 max-w-[1400px] w-full space-y-8 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <section className="bg-white border border-zinc-200 rounded-none p-5 shadow-sm flex flex-col justify-between items-start gap-1">
        <span className="text-[10px] uppercase tracking-widest text-[#E61E32] font-extrabold">Jury Connection & Pitch Hub</span>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
          Connect with the HackOS Jury
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5 leading-relaxed max-w-2xl">
          Get direct mentoring, pitch critique, and architectural evaluations from active judges. Request a slot below.
        </p>
      </section>

      {/* Jury Grid */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-2">
          <Award className="w-4 h-4 text-[#E61E32]" />
          Jury Panel Directory
        </h3>
        
        {judges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {judges.map((judge) => (
              <div
                key={judge.id}
                className="bg-white border border-zinc-200 rounded-none p-4 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center font-bold text-xs select-none shrink-0 bg-red-50 text-[#E61E32] border border-red-200">
                    {judge.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 truncate">{judge.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">Judge</p>
                  </div>
                </div>

                <div className="space-y-2 min-h-[48px]">
                  <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed">
                    {judge.description || "Official Hackathon judge and system auditor."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedJudge(judge);
                    setShowModal(true);
                  }}
                  className="w-full py-1.5 text-[10px] font-bold tracking-tight text-center rounded-none shadow-sm cursor-pointer transition-all bg-[#E61E32] hover:bg-[#c91527] text-white border border-[#c91527]"
                >
                  Request Consultation
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 p-8 text-center text-xs text-zinc-400 font-semibold shadow-sm">
            No judges have been registered by the organizers for this hackathon yet.
          </div>
        )}
      </section>

      {/* Requests History List */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-800 tracking-tight flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#E61E32]" />
          Team Request Log
        </h3>
        
        {requests.length > 0 ? (
          <div className="bg-white border border-zinc-200 rounded-none shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-500 text-[10px] uppercase tracking-wider">
                  <th className="p-3">Req ID</th>
                  <th className="p-3">Consultation Type</th>
                  <th className="p-3">Jury Member</th>
                  <th className="p-3">Requested At</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Jury Notes / Slot Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium text-zinc-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/50">
                    <td className="p-3 font-mono font-bold text-zinc-900 truncate max-w-[120px]">{req.id}</td>
                    <td className="p-3 font-bold">{req.type}</td>
                    <td className="p-3">{req.judgeName}</td>
                    <td className="p-3 text-zinc-500 font-normal">
                      {req.requestedAt.toLocaleDateString()} {req.requestedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${getStatusStyle(req.status)}`}>
                        {req.status === "Completed" && <CheckCircle className="w-3 h-3" />}
                        {req.status === "Confirmed" && <Video className="w-3 h-3 animate-pulse" />}
                        {req.status === "Pending" && <Clock className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-650 font-normal leading-relaxed max-w-sm">
                      {req.notes || "Awaiting slot link or judge assignment."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 p-8 text-center text-xs text-zinc-400 font-semibold shadow-sm">
            Your team has not requested any jury evaluations yet.
          </div>
        )}
      </section>

      {/* Request Modal */}
      {showModal && selectedJudge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 w-full max-w-md p-6 rounded-none shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#E61E32]" />
                Request Consultation
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedJudge(null);
                }}
                className="text-zinc-400 hover:text-zinc-650 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRequestReview} className="space-y-4 pt-4">
              <div className="bg-zinc-50 border border-zinc-200 p-3 flex gap-3 items-center">
                <div className="w-10 h-10 flex items-center justify-center font-bold text-xs select-none bg-red-50 border border-red-200 text-[#E61E32]">
                  {selectedJudge.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">{selectedJudge.name}</h4>
                  <p className="text-[10px] text-zinc-500">Official Jury Member</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                  Review Topic
                </label>
                <select
                  value={reviewType}
                  onChange={(e) => setReviewType(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs px-3 py-2 focus:outline-none focus:border-[#E61E32] font-semibold"
                >
                  <option value="Technical Critique">Technical Critique & DB Schema Review</option>
                  <option value="UI & UX Polish">UI/UX Audit & Accessibility Review</option>
                  <option value="Pitch Presentation">Slide Deck & Pitch Prep</option>
                  <option value="Final Demo Review">Deployment Check & Demo Review</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
                  Message / Context for the Judge
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain briefly what you'd like the judge to look at..."
                  rows={4}
                  className="w-full bg-zinc-50 border border-zinc-200 text-xs p-3 focus:outline-none focus:border-[#E61E32] font-normal leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowModal(false);
                    setSelectedJudge(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 border border-zinc-200 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#E61E32] hover:bg-[#c91527] text-white px-5 py-2 text-xs font-bold border border-[#c91527] cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
