"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchTopNavbarCountsAction } from "../../actions/team-feature-actions";

export default function TeamSubNavbar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Record<string, number>>({ messages: 0, jury: 0, roast: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const data = await fetchTopNavbarCountsAction();
        setCounts(data);
      } catch (err) {
        console.error("Failed to load subnavbar counts:", err);
      }
    };
    loadCounts();

    const interval = setInterval(loadCounts, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadCounts();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const links = [
    { name: "Messages", href: "/team/dashboard/messages", countKey: "messages" },
    { name: "Connect with Jury", href: "/team/dashboard/jury", countKey: "jury" },
    { name: "Roast My Site", href: "/team/dashboard/roast", countKey: "roast" },
  ];

  return (
    <nav className="w-full bg-white border-b border-zinc-200 px-6 flex items-center gap-6 text-sm font-semibold tracking-tight shadow-sm shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const count = counts[link.countKey] || 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`py-3 px-1 border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
              isActive
                ? "border-[#E61E32] text-zinc-900"
                : "border-transparent text-[#E61E32] sm:text-zinc-500 hover:text-zinc-950"
            }`}
          >
            <span>{link.name}</span>
            {count > 0 && (
              <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full transition-all ${
                isActive
                  ? "bg-[#E61E32] text-white border border-[#E61E32]"
                  : "bg-zinc-100 text-zinc-650 border border-zinc-200"
              }`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
