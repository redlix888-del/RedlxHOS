"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Megaphone,
  FolderOpen,
  UserCheck,
  Award,
  UploadCloud,
  Trophy,
  FileBadge,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lightbulb,
  FileText
} from "lucide-react";
import { teamLogOutAction } from "../../actions/team-auth-actions";

export default function TeamSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("team-sidebar-collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    } else {
      // Default to collapsed on mobile/tablets
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("team-sidebar-collapsed", String(newVal));
  };

  const menuItems = [
    { name: "Dashboard", href: "/team/dashboard", icon: LayoutDashboard },
    { name: "Problem Statements", href: "/team/dashboard/problem-statements", icon: FileText },
    { name: "Ideate & Validate", href: "/team/dashboard/ideate", icon: Lightbulb },
    { name: "My Team", href: "/team/dashboard/team", icon: Users },
    { name: "Schedule", href: "/team/dashboard/schedule", icon: Calendar },
    { name: "Tasks", href: "/team/dashboard/tasks", icon: CheckSquare },
    { name: "Announcements", href: "/team/dashboard/announcements", icon: Megaphone },
    { name: "Resources", href: "/team/dashboard/resources", icon: FolderOpen },
    { name: "Mentors", href: "/team/dashboard/mentors", icon: UserCheck },
    { name: "Judges", href: "/team/dashboard/judges", icon: Award },
    { name: "Project Submission", href: "/team/dashboard/project", icon: UploadCloud },
    { name: "Leaderboard", href: "/team/dashboard/leaderboard", icon: Trophy },
    { name: "Certificates", href: "/team/dashboard/certificates", icon: FileBadge },
    { name: "Profile", href: "/team/dashboard/profile", icon: User },
  ];

  return (
    <>
      {/* Backdrop for mobile slide-over drawer */}
      {!isCollapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-black/45 z-30" 
          onClick={() => setIsCollapsed(true)} 
        />
      )}

      {/* Floating action toggle button for mobile */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="md:hidden fixed bottom-4 right-4 z-50 bg-[#E61E32] text-white p-3 rounded-full shadow-lg border border-[#c91527] focus:outline-none cursor-pointer hover:bg-[#c91527] transition-all flex items-center justify-center animate-in zoom-in duration-200"
          title="Open Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <aside
        className={`bg-zinc-100 border-r border-zinc-200 h-full flex flex-col justify-between transition-all duration-300 shrink-0 select-none overflow-y-auto fixed md:relative z-40 top-14 bottom-0 left-0 md:top-0 ${
          isCollapsed ? "w-0 -translate-x-full md:w-16 md:translate-x-0" : "w-64 translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1">
          
          {/* Toggle Button Header */}
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between gap-2">
            {!isCollapsed && (
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-extrabold">
                Console Menu
              </span>
            )}
            <button
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer ml-auto"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Auto-collapse sidebar on mobile after clicking a link
                    if (window.innerWidth < 768) {
                      setIsCollapsed(true);
                    }
                  }}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded text-sm font-semibold tracking-tight transition-all duration-200 ${
                    isActive
                      ? "bg-red-50 text-[#E61E32] shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-[#E61E32]" : "text-zinc-400"}`}
                    strokeWidth={2.5}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Sign Out Button at bottom of sidebar */}
        <div className="h-[60px] px-4 border-t border-zinc-200 bg-transparent shrink-0 flex items-center">
          <form action={teamLogOutAction} className="w-full">
            <button
              type="submit"
              className={`w-full flex items-center gap-3 py-2 px-3 transition-colors bg-transparent border border-[#E61E32] text-[#E61E32] hover:bg-red-50/50 font-bold text-xs rounded-none cursor-pointer ${
                isCollapsed ? "justify-center px-0" : ""
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0 text-[#E61E32]" strokeWidth={2.5} />
              {!isCollapsed && <span className="truncate">Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
