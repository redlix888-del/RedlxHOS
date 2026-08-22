"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubNavbar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/organizer/dashboard" },
    { name: "My Hackathons", href: "/organizer/dashboard/hackathons" },
    { name: "Announcements", href: "/organizer/dashboard/announcements" },
    { name: "Judging Config", href: "/organizer/dashboard/judging" },
    { name: "Mentors", href: "/organizer/dashboard/mentors" },
    { name: "Project Submissions", href: "/organizer/dashboard/submissions" },
    { name: "Leaderboard", href: "/organizer/dashboard/leaderboard" },
    { name: "Participants", href: "/organizer/dashboard/participants" },
    { name: "Support Chat", href: "/organizer/dashboard/chat" },
    { name: "Console Settings", href: "/organizer/dashboard/settings" },
  ];

  return (
    <nav className="w-full bg-white border-b border-zinc-200 px-6 flex items-center gap-6 text-sm font-semibold tracking-tight shadow-sm shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`py-3 px-1 border-b-2 transition-colors shrink-0 ${
              isActive
                ? "border-[#E61E32] text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-950"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
