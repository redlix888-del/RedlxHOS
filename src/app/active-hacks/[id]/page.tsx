import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FAQAccordion from "./FAQAccordion";
import { Calendar, MapPin, Users, Ticket, Map } from "lucide-react";

 // We'll write this simple client helper in a separate file or inline

interface PublicDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicHackathonDetailPage({ params }: PublicDetailProps) {
  const { id } = await params;

  // Query hackathon details including prizes, faqs, schedule items, and registrations
  const hackathon = await prisma.hackathon.findUnique({
    where: { id },
    include: {
      prizes: true,
      faqs: true,
      scheduleItems: true,
      registrations: true,
      ticketTiers: true,
      problemStatements: true,
    },
  });

  if (!hackathon || hackathon.status === "Draft") {
    notFound();
  }

  const startDate = new Date(hackathon.startDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endDate = new Date(hackathon.endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {/* 1. PUBLIC HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#E61E32] border-b border-[#c91527] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Link href="/" className="font-semibold text-base sm:text-lg tracking-tight text-white hover:text-red-100 transition-colors shrink-0">
            HackOS
          </Link>
          <span className="text-red-200 text-xs sm:text-sm font-normal shrink-0">/</span>
          <Link href="/active-hacks" className="hidden md:inline text-red-100 hover:text-white text-xs sm:text-sm font-medium transition-colors shrink-0">
            Active Hacks Hub
          </Link>
          <span className="hidden md:inline text-red-200 text-xs sm:text-sm font-normal shrink-0">/</span>
          <span className="text-white text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-xs">{hackathon.title}</span>
        </div>

        <div className="shrink-0">
          <Link
            href="/sign-in"
            className="text-zinc-700 hover:text-zinc-900 border border-zinc-300 hover:border-zinc-400 bg-white font-bold py-1.5 px-3 sm:px-4 rounded text-[10px] sm:text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="hidden sm:inline">Want to </span>Host a Hack?
          </Link>
        </div>
      </header>

      {/* 2. SPECIALIZED DETAIL WORKSPACE */}
      <main className="p-6 md:p-8 max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
        
        {/* Main Content Column (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Banner & Title Area */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
            <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-900 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  hackathon.bannerUrl ||
                  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000"
                }
                alt={hackathon.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
                  {hackathon.tag}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${
                    hackathon.status === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : hackathon.status === "Draft"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}
                >
                  {hackathon.status}
                </span>
              </div>

              <h1 className="text-3xl font-medium tracking-tight text-zinc-900 leading-tight">
                {hackathon.title}
              </h1>

              <div className="border-t border-zinc-100 pt-4">
                <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">About Event</h3>
                <p className="text-zinc-650 text-sm font-normal leading-relaxed whitespace-pre-line">
                  {hackathon.description}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline & Schedule Section */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-zinc-150 pb-3">
              <h2 className="text-lg font-medium text-zinc-900">Event Timeline & Schedule</h2>
              <p className="text-zinc-400 text-[11px] mt-0.5 font-normal">
                Check chronological milestones and event slots.
              </p>
            </div>

            {hackathon.scheduleItems.length === 0 ? (
              <p className="text-zinc-400 italic text-sm py-4 text-center font-normal">
                No schedule events are configured for this hackathon.
              </p>
            ) : (
              <div className="relative border-l border-zinc-200 pl-5 ml-2.5 space-y-6 py-2">
                {hackathon.scheduleItems.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#E61E32] ring-4 ring-red-50" />
                    <p className="text-xs font-bold text-[#E61E32] tracking-wide">{item.time}</p>
                    <p className="text-zinc-800 text-sm font-bold mt-0.5">{item.eventName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Problem Statements & Tracks Section */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-zinc-150 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-zinc-900">Event Problem Statements & Tracks</h2>
                <p className="text-zinc-400 text-[11px] mt-0.5 font-normal">
                  Explore available challenge tracks and technical problem briefs.
                </p>
              </div>
              <span className="bg-[#E61E32] text-white text-[10px] font-extrabold px-2.5 py-1 rounded">
                {hackathon.problemStatements.length} Challenge Track(s)
              </span>
            </div>

            {hackathon.problemStatements.length === 0 ? (
              <p className="text-zinc-400 italic text-sm py-4 text-center font-normal">
                Problem statements have not been published yet for this event.
              </p>
            ) : (
              <div className="space-y-4">
                {hackathon.problemStatements.map((ps) => (
                  <div key={ps.id} className="border border-zinc-200 bg-zinc-50/50 p-5 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#E61E32] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                        {ps.track}
                      </span>
                      {ps.difficulty && (
                        <span className="bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          Difficulty: {ps.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-zinc-900 font-bold text-sm">{ps.title}</h3>
                    <p className="text-zinc-650 font-normal text-xs leading-relaxed whitespace-pre-line bg-white border border-zinc-200 p-3 rounded">
                      {ps.description}
                    </p>
                    {(ps.pdfUrl || ps.resourceUrl) && (
                      <div className="flex items-center gap-4 text-xs font-bold pt-1">
                        {ps.pdfUrl && (
                          <a href={ps.pdfUrl} target="_blank" rel="noreferrer" className="text-[#E61E32] hover:underline">
                            Download Problem Brief (PDF)
                          </a>
                        )}
                        {ps.resourceUrl && (
                          <a href={ps.resourceUrl} target="_blank" rel="noreferrer" className="text-zinc-700 hover:underline">
                            Starter Kit / Resources
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-zinc-150 pb-3">
              <h2 className="text-lg font-medium text-zinc-900">Prizes & Categories</h2>
              <p className="text-zinc-400 text-[11px] mt-0.5 font-normal">
                Review available tracks and reward distributions.
              </p>
            </div>

            {hackathon.prizes.length === 0 ? (
              <p className="text-zinc-400 italic text-sm py-4 text-center font-normal">
                No prize breakdown levels have been declared.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hackathon.prizes.map((prize) => (
                  <div key={prize.id} className="border border-zinc-200 bg-zinc-50/50 p-5 rounded-lg space-y-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-zinc-900 font-bold text-sm leading-snug">{prize.title}</span>
                      <span className="text-[#E61E32] font-black text-sm shrink-0">{prize.value}</span>
                    </div>
                    {prize.description && (
                      <p className="text-zinc-500 font-normal text-xs leading-relaxed pt-1 border-t border-dashed border-zinc-200 mt-2">
                        {prize.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ & Q&A Queries Section */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-zinc-150 pb-3">
              <h2 className="text-lg font-medium text-zinc-900">FAQ & Queries</h2>
              <p className="text-zinc-400 text-[11px] mt-0.5 font-normal">
                Find answers to common developer inquiries.
              </p>
            </div>

            {hackathon.faqs.length === 0 ? (
              <p className="text-zinc-400 italic text-sm py-4 text-center font-normal">
                No FAQs configured.
              </p>
            ) : (
              <FAQAccordion faqs={hackathon.faqs.map(f => ({ id: f.id, question: f.question, answer: f.answer }))} />
            )}
          </div>

        </div>

        {/* Sidebar Column (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm sticky top-24 space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Prize Pool</p>
              <h2 className="text-3xl font-black text-[#E61E32] mt-1">{hackathon.prizePool}</h2>
            </div>

            <div className="border-t border-zinc-100 pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Timeline</p>
                  <p className="text-xs text-zinc-800 font-bold mt-0.5">{startDate}</p>
                  <p className="text-xs text-zinc-500 font-medium">to {endDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Location</p>
                  <p className="text-xs text-zinc-800 font-bold mt-0.5 truncate max-w-[200px]">{hackathon.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Registrations</p>
                  <p className="text-xs text-zinc-800 font-bold mt-0.5">{hackathon.registrations.length} Competitors</p>
                </div>
              </div>
            </div>

            {/* Ticket Tiers / Pricing details */}
            <div className="border-t border-zinc-100 pt-5 space-y-3">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Tickets & Passes</p>
              {hackathon.ticketTiers.length === 0 ? (
                <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded p-3 text-xs font-semibold">
                  <span className="text-zinc-650">General Admission</span>
                  <span className="text-green-700 font-extrabold">Free</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {hackathon.ticketTiers.map((tier) => (
                    <Link
                      key={tier.id}
                      href={`/active-hacks/${hackathon.id}/register?tierId=${tier.id}`}
                      className="flex justify-between items-center bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded p-3 text-xs font-semibold transition-all hover:bg-zinc-100/50 block group cursor-pointer"
                    >
                      <span className="text-zinc-800 font-bold group-hover:text-[#E61E32] transition-colors">{tier.name}</span>
                      <div className="text-right shrink-0">
                        <span className="text-[#E61E32] font-black block">₹{tier.priceINR}</span>
                        <span className="text-[8px] text-zinc-400 font-normal uppercase tracking-wider block">Choose</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Vertical Stacked Actions */}
            <div className="border-t border-zinc-100 pt-5 flex flex-col gap-3 text-xs font-bold">
              <Link
                href={`/active-hacks/${hackathon.id}/register`}
                className="w-full text-center bg-[#E61E32] hover:bg-[#c91527] text-white py-2.5 px-4 rounded transition-colors shadow-sm cursor-pointer"
              >
                Register to Compete
              </Link>

              {hackathon.locationLink ? (
                <a
                  href={hackathon.locationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 rounded bg-white text-zinc-700 py-2.5 px-4 transition-colors cursor-pointer"
                >
                  View Location Map
                </a>
              ) : null}

              <Link
                href={`/team/login?hackathonId=${hackathon.id}`}
                className="w-full text-center border border-[#E61E32] hover:bg-red-50 text-[#E61E32] py-2.5 px-4 rounded transition-colors cursor-pointer"
              >
                Team Lead Login
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
