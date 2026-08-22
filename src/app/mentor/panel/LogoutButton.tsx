"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutMentorAction } from "../../actions/mentor-actions";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logoutMentorAction();
      if (res.success) {
        router.refresh();
        router.push("/mentor/login");
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="bg-transparent hover:bg-white/10 text-white/95 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      Sign Out
    </button>
  );
}
