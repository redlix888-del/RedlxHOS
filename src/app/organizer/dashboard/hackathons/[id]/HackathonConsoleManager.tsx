"use client";

import { useActionState, startTransition, useState, useEffect } from "react";
import { saveConsoleDataAction } from "../../../../actions/console-actions";
import { useRouter } from "next/navigation";
import ProblemStatementManager from "./ProblemStatementManager";

interface Prize {
  id: string;
  title: string;
  value: string;
  description: string | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ScheduleItem {
  id: string;
  time: string;
  eventName: string;
}

interface HackathonConsoleManagerProps {
  hackathon: {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: string;
    tag: string;
    location: string;
    prizePool: string;
    bannerUrl: string | null;
    ticketingLink: string | null;
    locationLink: string | null;
    registrations: any[];
    prizes: Prize[];
    faqs: FAQ[];
    scheduleItems: ScheduleItem[];
    problemStatements?: any[];
  };
}

type TabType = "overview" | "problem_statements" | "schedule" | "faqs";

export default function HackathonConsoleManager({ hackathon }: HackathonConsoleManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [state, formAction, isPending] = useActionState(saveConsoleDataAction, null);
  const router = useRouter();
  const [successMsg, setSuccessMsg] = useState("");

  // Local state for FAQs
  const [faqs, setFaqs] = useState<FAQ[]>(() =>
    hackathon.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))
  );

  // Local state for Schedule
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() =>
    hackathon.scheduleItems.map((s) => ({ id: s.id, time: s.time, eventName: s.eventName }))
  );

  useEffect(() => {
    if (state?.success) {
      setSuccessMsg("Console content updated successfully!");
      router.refresh();
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  const addFAQ = () => {
    setFaqs([...faqs, { id: crypto.randomUUID(), question: "", answer: "" }]);
  };

  const removeFAQ = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, { id: crypto.randomUUID(), time: "", eventName: "" }]);
  };

  const removeScheduleItem = (id: string) => {
    setScheduleItems(scheduleItems.filter((s) => s.id !== id));
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: string) => {
    setScheduleItems(scheduleItems.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add serialized arrays
    formData.append("faqs", JSON.stringify(faqs.map(({ question, answer }) => ({ question, answer }))));
    formData.append("scheduleItems", JSON.stringify(scheduleItems.map(({ time, eventName }) => ({ time, eventName }))));
    
    startTransition(() => {
      formAction(formData);
    });
  };

  const startDateStr = new Date(hackathon.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endDateStr = new Date(hackathon.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      
      {successMsg && (
        <div className="bg-green-50 text-green-700 text-xs p-3 border-l-4 border-green-500 font-semibold animate-in fade-in duration-150">
          {successMsg}
        </div>
      )}

      {state?.error && (
        <div className="bg-red-50 text-red-600 text-xs p-3 border-l-4 border-red-500 font-semibold">
          {state.error}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="border-b border-zinc-200 flex gap-4 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-1 transition-all duration-150 relative cursor-pointer ${
            activeTab === "overview" ? "text-[#E61E32] font-black" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Overview Details
          {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E61E32]" />}
        </button>

        <button
          onClick={() => setActiveTab("problem_statements")}
          className={`pb-3 px-1 transition-all duration-150 relative cursor-pointer ${
            activeTab === "problem_statements" ? "text-[#E61E32] font-black" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Problem Statements ({hackathon.problemStatements?.length || 0})
          {activeTab === "problem_statements" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E61E32]" />}
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 px-1 transition-all duration-150 relative cursor-pointer ${
            activeTab === "schedule" ? "text-[#E61E32] font-black" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Event Schedule
          {activeTab === "schedule" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E61E32]" />}
        </button>

        <button
          onClick={() => setActiveTab("faqs")}
          className={`pb-3 px-1 transition-all duration-150 relative cursor-pointer ${
            activeTab === "faqs" ? "text-[#E61E32] font-black" : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          FAQ & Queries
          {activeTab === "faqs" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E61E32]" />}
        </button>
      </div>

      {activeTab === "problem_statements" && (
        <ProblemStatementManager
          hackathonId={hackathon.id}
          problemStatements={hackathon.problemStatements || []}
        />
      )}

      <form onSubmit={handleSubmit} className={`text-xs font-semibold space-y-6 ${activeTab === "problem_statements" ? "hidden" : ""}`}>
        <input type="hidden" name="hackathonId" value={hackathon.id} />

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm animate-in fade-in duration-100">
            {/* Header banner */}
            <div
              className="h-44 w-full relative bg-zinc-950 bg-cover bg-center"
              style={{
                backgroundImage: `url(${hackathon.bannerUrl || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000"})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E61E32] text-white rounded mb-2 inline-block">
                    {hackathon.tag}
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {hackathon.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-zinc-100 pb-6 text-zinc-650">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 17H5V9h14v11zm0-13H5V5h14v2z" />
                  </svg>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400">Timeline</p>
                    <p className="text-zinc-800 font-bold">{startDateStr} - {endDateStr}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400">Location</p>
                    <p className="text-zinc-800 font-bold">{hackathon.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400">Registrations</p>
                    <p className="text-zinc-800 font-bold">{hackathon.registrations.length} Developers</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-800 mb-2">Event Description</h4>
                <p className="text-zinc-600 text-xs font-normal leading-relaxed whitespace-pre-line bg-zinc-50 border border-zinc-150 p-4 rounded-lg">
                  {hackathon.description}
                </p>
              </div>

              {/* Prize Pool Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-800 mb-3">
                  Prizes & Rewards (Total Pool: {hackathon.prizePool})
                </h4>
                {hackathon.prizes.length === 0 ? (
                  <p className="text-zinc-500 font-normal">No prize levels declared.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hackathon.prizes.map((prize) => (
                      <div key={prize.id} className="border border-zinc-200 bg-zinc-50/50 p-4 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-900 font-bold text-xs">{prize.title}</span>
                          <span className="text-[#E61E32] font-black text-xs">{prize.value}</span>
                        </div>
                        {prize.description && (
                          <p className="text-zinc-500 font-normal text-[11px] leading-relaxed">
                            {prize.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Section */}
              <div className="flex gap-6 border-t border-zinc-100 pt-6">
                {hackathon.locationLink && (
                  <a
                    href={hackathon.locationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#E61E32] hover:underline"
                  >
                    <svg className="w-4 h-4 text-[#E61E32] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48v15.12c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                    </svg>
                    Location Map
                  </a>
                )}
                {hackathon.ticketingLink && (
                  <a
                    href={hackathon.ticketingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#E61E32] hover:underline"
                  >
                    <svg className="w-4 h-4 text-[#E61E32] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-2 .89-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2V6.5h2v2z" />
                    </svg>
                    Registration Tickets
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schedule timeline management */}
        {activeTab === "schedule" && (
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6 animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800">
                  Event Timeline & Schedule
                </h3>
                <p className="text-[10px] text-zinc-400 font-normal mt-0.5">
                  Set up dynamic timelines. Add new events or modify time slots.
                </p>
              </div>

              <button
                type="button"
                onClick={addScheduleItem}
                className="flex items-center text-[#E61E32] hover:text-[#c91527] text-xs font-bold transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Schedule Item
              </button>
            </div>

            {scheduleItems.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-lg p-8 text-center text-zinc-500 font-normal">
                No schedule events added. Click &quot;Add Schedule Item&quot; above to create a timeline slot.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header columns */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] uppercase tracking-wider text-zinc-400">
                  <div className="col-span-3">Time slot *</div>
                  <div className="col-span-8">Event Name / Activity *</div>
                  <div className="col-span-1 text-center">Delete</div>
                </div>

                <div className="space-y-3">
                  {scheduleItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-3 items-center bg-zinc-50/50 p-3 md:p-1 border border-zinc-100 md:border-none rounded-lg"
                    >
                      {/* Time slot */}
                      <div className="col-span-12 md:col-span-3">
                        <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                          Time slot *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10:00 AM"
                          value={item.time}
                          onChange={(e) => updateScheduleItem(item.id, "time", e.target.value)}
                          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 outline-none focus:ring-1 focus:ring-[#E61E32] focus:border-[#E61E32]"
                        />
                      </div>

                      {/* Event name */}
                      <div className="col-span-10 md:col-span-8">
                        <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                          Event Name / Activity *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Opening Ceremony"
                          value={item.eventName}
                          onChange={(e) => updateScheduleItem(item.id, "eventName", e.target.value)}
                          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 outline-none focus:ring-1 focus:ring-[#E61E32] focus:border-[#E61E32]"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => removeScheduleItem(item.id)}
                          title="Remove item"
                          className="p-2 text-zinc-400 hover:text-[#E61E32] border border-zinc-200 md:border-none rounded bg-white md:bg-transparent cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer action for Tab */}
            {scheduleItems.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-zinc-200">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#E61E32] hover:bg-[#c91527] text-white font-semibold py-2 px-6 rounded text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Schedule Timeline"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: FAQ Queries management */}
        {activeTab === "faqs" && (
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm space-y-6 animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800">
                  Event FAQ Queries
                </h3>
                <p className="text-[10px] text-zinc-400 font-normal mt-0.5">
                  Configure dynamic FAQ lists. Answer developer queries.
                </p>
              </div>

              <button
                type="button"
                onClick={addFAQ}
                className="flex items-center text-[#E61E32] hover:text-[#c91527] text-xs font-bold transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add FAQ Query
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-lg p-8 text-center text-zinc-500 font-normal">
                No FAQs added. Click &quot;Add FAQ Query&quot; above to create a question/answer slot.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header columns */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] uppercase tracking-wider text-zinc-400">
                  <div className="col-span-5">Question *</div>
                  <div className="col-span-6">Answer *</div>
                  <div className="col-span-1 text-center">Delete</div>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="grid grid-cols-12 gap-3 items-start bg-zinc-50/50 p-3 md:p-1 border border-zinc-100 md:border-none rounded-lg"
                    >
                      {/* Question */}
                      <div className="col-span-12 md:col-span-5">
                        <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                          Question *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Who can register?"
                          value={faq.question}
                          onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 outline-none focus:ring-1 focus:ring-[#E61E32] focus:border-[#E61E32]"
                        />
                      </div>

                      {/* Answer */}
                      <div className="col-span-10 md:col-span-6">
                        <label className="block md:hidden text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                          Answer *
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="e.g. Any university student over 18 years old..."
                          value={faq.answer}
                          onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                          className="w-full text-xs p-2 border border-zinc-200 bg-white text-zinc-900 outline-none focus:ring-1 focus:ring-[#E61E32] focus:border-[#E61E32] resize-none"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-2 md:col-span-1 flex justify-center items-center pt-2 md:pt-1">
                        <button
                          type="button"
                          onClick={() => removeFAQ(faq.id)}
                          title="Remove item"
                          className="p-2 text-zinc-400 hover:text-[#E61E32] border border-zinc-200 md:border-none rounded bg-white md:bg-transparent cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer action for Tab */}
            {faqs.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-zinc-200">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#E61E32] hover:bg-[#c91527] text-white font-semibold py-2 px-6 rounded text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save FAQ Queries"}
                </button>
              </div>
            )}
          </div>
        )}

      </form>
    </div>
  );
}
