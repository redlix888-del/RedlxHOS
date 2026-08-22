import Link from "next/link";
import { Ticket, Calendar, Trophy } from "lucide-react";
import { Inter } from "next/font/google";
import PixelBlast from "../components/PixelBlast";
import CardNav from "../components/CardNav";
import { prisma } from "../lib/db";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export default async function Home() {
  let isDbHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Home page live check failed:", error);
    isDbHealthy = false;
  }

  const navItems = [
    {
      label: "Discover",
      bgColor: "#1E2022",
      textColor: "#ffffff",
      links: [
        { label: "Active Hacks", href: "/active-hacks", ariaLabel: "Explore Active Hackathons" },
        { label: "HOS Status", href: "/status", ariaLabel: "Platform Status" }
      ]
    },
    {
      label: "Join Us",
      bgColor: "#E61E32",
      textColor: "#ffffff",
      links: [
        { label: "Team Leads Sign Up", href: "/team/signup", ariaLabel: "Sign Up for Teams" }
      ]
    },
    {
      label: "Organizer",
      bgColor: "#2C2E33",
      textColor: "#ffffff",
      links: [
        { label: "Host a Hack", href: "/sign-in", ariaLabel: "Sign in to host events" },
        { label: "Admin Console", href: "/sign-in", ariaLabel: "Go to Organizer Dashboard" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans justify-between antialiased">

      {/* 1. CARD NAVIGATION HEADER */}
      <div className="sticky top-4 z-50 w-full h-[60px] pointer-events-none shrink-0 mt-4">
        <div className="pointer-events-auto w-full h-full relative">
          <CardNav
            logo="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            logoAlt="HackOS Logo"
            items={navItems}
            baseColor="#1E2022"
            menuColor="#ffffff"
            buttonBgColor="#E61E32"
            buttonTextColor="#ffffff"
          />
        </div>
      </div>

      {/* 2. MAIN HERO SECTION */}
      <main className="flex-1 w-[calc(100%-1rem)] max-w-[1600px] mx-auto -mt-[30px] pt-0 pb-12 md:pb-16 flex flex-col items-center justify-center gap-12">
        
        {/* Vercel-Style Hero Card */}
        <div 
          className={`${inter.className} relative w-full overflow-hidden rounded-2xl border border-red-600/20 px-4 md:px-6 py-20 md:py-48 text-center shadow-xl flex flex-col items-center justify-center gap-6`}
          style={{
            backgroundImage: `
              radial-gradient(circle at bottom, rgba(230, 30, 50, 0.3) 0%, rgba(230, 30, 50, 0) 70%),
              linear-gradient(to bottom, #E61E32, #b81424)
            `,
            backgroundSize: '100% 100%, 100% 100%'
          }}
        >
          {/* Interactive Background Effect (PixelBlast in White) */}
          <div className="absolute inset-0 z-0">
            <PixelBlast
              variant="circle"
              pixelSize={5}
              color="#ffffff"
              patternScale={2.5}
              patternDensity={1.1}
              pixelSizeJitter={0.3}
              enableRipples={true}
              rippleSpeed={0.3}
              rippleThickness={0.1}
              rippleIntensityScale={1.5}
              transparent={true}
              edgeFade={0.4}
              speed={0.4}
            />
          </div>

          {/* Decorative Badge */}
          <div className="relative z-10 inline-flex items-center gap-1.5 bg-white/10 text-white border border-white/20 rounded-md px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDbHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {isDbHealthy ? 'Systems Operational' : 'Systems Degraded'}
          </div>

          {/* Hero Title */}
          <h1 className="relative z-10 text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-white max-w-4xl leading-[1.0]">
            Launch, Manage, and Discover Hackathons Internationally.
          </h1>

          {/* Hero Description */}
          <p className="relative z-10 text-white text-xs sm:text-sm max-w-2xl leading-relaxed font-medium tracking-[-0.01em]">
            HackOS provides organizations with a dynamic workspace console to track developer registrations, set up custom timelines, itemize cash prize rewards, and host event schedules in real-time.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 w-full max-w-xs sm:max-w-md relative z-10">
            <Link
              href="/active-hacks"
              className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3 px-8 rounded-lg text-xs transition-all shadow-md hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
            >
              Explore Active Hacks
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-8 rounded-lg text-xs transition-all backdrop-blur-xs text-center cursor-pointer"
            >
              Organizer Console
            </Link>
          </div>

          {/* Bottom highlight glow effect */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-gradient-to-t from-[#E61E32]/20 via-[#E61E32]/5 to-transparent blur-xl rounded-full pointer-events-none" />
        </div>
      </main>

      {/* 3. PUBLIC FOOTER */}
      <footer className="w-[calc(100%-1rem)] max-w-[1600px] mx-auto border-t border-zinc-200/60 py-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-700 font-normal shrink-0">
        <span>© 2026 HackOS Platform. All Rights Reserved.</span>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <span>Powered by</span>
          <img
            src="https://ik.imagekit.io/dypkhqxip/redlix%20new?updatedAt=1781042212493"
            alt="Redlix Logo"
            className="h-5 object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </footer>

    </div>
  );
}
