"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Users, Loader2, Lock, Search, RefreshCw, AlertCircle } from "lucide-react";
import { fetchTeamMessagesForMentorOrOrganizerAction, sendMessageFromMentorOrOrganizerAction } from "../app/actions/mentor-actions";

interface Member {
  id: string;
  fullName: string;
  email: string;
}

interface Team {
  id: string;
  teamName: string;
  teamLeadName: string;
  email: string;
  members: Member[];
}

interface Message {
  id: string;
  content: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  createdAt: Date;
}

interface Props {
  teams: Team[];
  currentUserRole: "Mentor" | "Organizer";
}

export default function SupportChatConsole({ teams, currentUserRole }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Filter teams by search
  const filteredTeams = teams.filter(
    (t) =>
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teamLeadName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Load messages for the selected team
  const loadMessages = async (teamId: string, showLoader = false) => {
    if (showLoader) setIsLoadingMessages(true);
    setError(null);
    try {
      const res = await fetchTeamMessagesForMentorOrOrganizerAction(teamId);
      if (res.success && res.messages) {
        setMessages(
          res.messages.map((m) => ({
            id: m.id,
            content: m.content,
            senderName: m.senderName,
            senderRole: m.senderRole,
            senderAvatar: m.senderAvatar,
            createdAt: new Date(m.createdAt),
          }))
        );
      } else {
        setError(res.error || "Failed to load messages.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch messages.");
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  // Poll for new messages when a team is selected
  useEffect(() => {
    if (!selectedTeamId) return;

    loadMessages(selectedTeamId, true);

    const interval = setInterval(() => {
      loadMessages(selectedTeamId, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedTeamId]);

  // Scroll down on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedTeamId || isSending) return;

    setInputText("");
    setIsSending(true);

    try {
      const res = await sendMessageFromMentorOrOrganizerAction(text, selectedTeamId, "team-squad");
      if (res.success && res.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.message.id,
            content: res.message.content,
            senderName: res.message.senderName,
            senderRole: res.message.senderRole,
            senderAvatar: res.message.senderAvatar,
            createdAt: new Date(res.message.createdAt),
          },
        ]);
        setTimeout(scrollToBottom, 50);
      } else {
        alert(res.error || "Failed to send message.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error sending message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 shadow-sm flex flex-col md:flex-row h-[600px] overflow-hidden rounded-none w-full animate-in fade-in duration-200">
      
      {/* Sidebar: Teams List */}
      <aside className="w-full md:w-80 border-r border-zinc-200 flex flex-col h-full bg-zinc-50/50 shrink-0">
        <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#E61E32]" />
              Active Team Sync
            </h4>
            <span className="text-[9px] font-black uppercase bg-red-50 text-[#E61E32] border border-red-200 px-1.5 py-0.5 rounded-none">
              Console
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search team or lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#E61E32] transition-colors rounded-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-250">
          {filteredTeams.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 italic">No teams found</div>
          ) : (
            filteredTeams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const initials = team.teamName.slice(0, 2).toUpperCase();

              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-zinc-100/50 focus:outline-none cursor-pointer ${
                    isSelected ? "bg-red-50/60 border-l-4 border-l-[#E61E32]" : ""
                  }`}
                >
                  <div className="w-9 h-9 bg-zinc-900 text-white border border-zinc-800 font-black text-xs flex items-center justify-center rounded-none shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 truncate block">
                        {team.teamName}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium block truncate mt-0.5">
                      Lead: {team.teamLeadName}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col h-full bg-zinc-50/20 relative">
        {selectedTeam ? (
          <>
            {/* Header */}
            <div className="h-14 px-5 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-red-100 text-[#E61E32] border border-red-200 flex items-center justify-center font-bold text-xs rounded-none">
                  {selectedTeam.teamName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 truncate">
                    {selectedTeam.teamName} — Squad Sync
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium truncate">
                    Members: {selectedTeam.teamLeadName} (Lead)
                    {selectedTeam.members.map((m) => `, ${m.fullName}`)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => loadMessages(selectedTeamId, true)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
                title="Refresh Chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-b border-red-200 p-2.5 text-[11px] font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Messages Feed */}
            <div
              ref={scrollContainerRef}
              className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-zinc-50/50"
            >
              {isLoadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#E61E32] animate-spin" />
                  <span className="text-xs text-zinc-400 font-bold mt-2">Loading Team messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.senderRole === currentUserRole;
                  const theme = isMe
                    ? {
                        bg: "bg-[#E61E32]",
                        border: "border-[#c91527]",
                        senderText: "text-white/95",
                        badge: "bg-white/20 text-white",
                        timeText: "text-white/80",
                        content: "text-white",
                      }
                    : {
                        bg: "bg-white",
                        border: "border-zinc-200",
                        senderText: "text-zinc-900",
                        badge: "bg-zinc-100 text-zinc-650",
                        timeText: "text-zinc-400",
                        content: "text-zinc-800",
                      };

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isMe ? "justify-end pl-12" : "justify-start pr-12 gap-2.5 items-start"}`}
                    >
                      {!isMe && (
                        <div className="w-7 h-7 bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`${theme.bg} ${theme.border} border rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[80%] md:max-w-[70%] shadow-xs`}>
                        <div className="flex items-center justify-between gap-3 mb-1 border-b border-black/5 pb-0.5">
                          <span className={`text-[10px] font-bold ${theme.senderText}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${theme.badge}`}>
                            {msg.senderRole}
                          </span>
                        </div>
                        <p className={`text-xs ${theme.content} leading-relaxed font-normal break-words`}>
                          {msg.content}
                        </p>
                        <div className="flex items-center justify-end mt-1">
                          <span className={`text-[9px] ${theme.timeText}`}>
                            {msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-300 mb-2" />
                  <p className="text-xs font-bold text-zinc-400">Sync Active — No messages found</p>
                  <p className="text-[10px] text-zinc-400 max-w-xs leading-relaxed mt-1">
                    Send a message below to establish contact with this team lead.
                  </p>
                </div>
              )}
            </div>

            {/* Chat Input composition bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Reply to the team lead..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-200 text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#E61E32] font-medium leading-relaxed rounded-none"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="bg-[#E61E32] hover:bg-[#c91527] disabled:bg-zinc-150 text-white font-bold p-2.5 rounded-none border border-[#E61E32] transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Lock className="w-10 h-10 text-zinc-200 mb-3" />
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No Team Chat Selected</h4>
            <p className="text-[10px] text-zinc-400 max-w-xs mt-1 leading-relaxed">
              Select a team from the panel on the left to sync their team chat box, read messages, and reply to support inquiries.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
