"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Hash,
  Shield,
  Lock,
  Globe,
  User,
  MessageSquare,
  Loader2,
  Sparkles,
  Info,
  Gavel,
  Search,
  ListFilter,
  Paperclip,
  Smile,
  Mic,
  Video,
  Phone,
  Image,
  Camera,
  File,
  UserRound,
  ChartBarIncreasing,
  Brush,
  MessageSquareDot,
  Star,
  Users,
} from "lucide-react";
import {
  fetchMessagesAction,
  sendMessageAction,
  fetchChannelMessageCountsAction,
  getCurrentUserAction,
  fetchChatContactsAction,
} from "../../../actions/team-feature-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  content: string;
  recipientName?: string | null;
  isPrivate?: boolean;
  createdAt: Date;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  scope: "public" | "squad" | "dm";
  recipientId?: string;
  recipientName?: string;
  avatarUrl?: string;
}

interface ChatContact {
  id: string;
  name: string;
  role: string;
  email: string | null;
  avatarUrl: string | null;
  type: "teammate" | "judge";
}

const getBubbleColors = (name: string, isMe: boolean) => {
  if (isMe) {
    return {
      bg: "bg-red-500 text-white",
      border: "border-red-600",
      senderText: "text-white/90",
      badge: "bg-white/20 text-white",
      timeText: "text-white/80",
      content: "text-white",
    };
  }

  const themes = [
    { bg: "bg-white text-zinc-900", border: "border-zinc-200", senderText: "text-sky-700", badge: "bg-sky-50 text-sky-700", timeText: "text-zinc-400", content: "text-zinc-800" },
    { bg: "bg-white text-zinc-900", border: "border-zinc-200", senderText: "text-purple-700", badge: "bg-purple-50 text-purple-700", timeText: "text-zinc-400", content: "text-zinc-800" },
    { bg: "bg-white text-zinc-900", border: "border-zinc-200", senderText: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700", timeText: "text-zinc-400", content: "text-zinc-800" },
    { bg: "bg-white text-zinc-900", border: "border-zinc-200", senderText: "text-amber-700", badge: "bg-amber-50 text-amber-700", timeText: "text-zinc-400", content: "text-zinc-800" },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % themes.length;
  return themes[index];
};

const renderSystemMessage = (content: string) => {
  const prefix = "System added ";
  const suffix = " to the console.";
  if (content.startsWith(prefix) && content.endsWith(suffix)) {
    const namePart = content.slice(prefix.length, -suffix.length);
    return (
      <>
        System added <span className="text-[#E61E32] font-black">{namePart}</span> to the console.
      </>
    );
  }
  return content;
};

export default function TeamMessagesPage() {
  const [activeChannelId, setActiveChannelId] = useState("team-squad");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "squad" | "public" | "dm">("all");
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; avatarUrl: string | null } | null>(null);
  const [contacts, setContacts] = useState<{ squad: ChatContact[]; judges: ChatContact[] }>({ squad: [], judges: [] });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Static Public Channels
  const publicChannels: Channel[] = [
    {
      id: "announcements",
      name: "announcements",
      description: "Official broadcasts from Hackathon Organizers",
      scope: "public",
    },
    {
      id: "public-general",
      name: "public-lounge",
      description: "Public hackathon chat across all teams",
      scope: "public",
    },
    {
      id: "tech-support",
      name: "tech-support",
      description: "Ask questions to mentors & tech crew",
      scope: "public",
    },
  ];

  // Squad Private Channel
  const squadChannel: Channel = {
    id: "team-squad",
    name: "squad-sync",
    description: "Private team sync room — Strictly confidential to squad",
    scope: "squad",
  };

  const getActiveChannelConfig = (): Channel => {
    if (activeChannelId === squadChannel.id) return squadChannel;
    const pub = publicChannels.find((c) => c.id === activeChannelId);
    if (pub) return pub;

    if (activeChannelId.startsWith("dm_")) {
      const targetId = activeChannelId.replace("dm_", "");
      const allContacts = [...contacts.squad, ...contacts.judges];
      const target = allContacts.find((c) => c.id === targetId || c.email === targetId);
      return {
        id: activeChannelId,
        name: target ? target.name : "Direct Message",
        description: `Confidential 1-on-1 with ${target?.name || "recipient"}`,
        scope: "dm",
        recipientId: target?.id || targetId,
        recipientName: target?.name || "Direct Recipient",
        avatarUrl: target?.avatarUrl || undefined,
      };
    }

    return squadChannel;
  };

  const currentChannel = getActiveChannelConfig();

  // Scroll to bottom without scrolling the parent dashboard window
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Fetch messages from backend
  const loadMessages = async (channelId: string, showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const activeConf = getActiveChannelConfig();
      const data = await fetchMessagesAction(channelId, activeConf.recipientId);
      const parsed = data.map((msg) => ({
        id: msg.id,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        senderRole: msg.senderRole,
        content: msg.content,
        recipientName: msg.recipientName,
        isPrivate: msg.isPrivate,
        createdAt: new Date(msg.createdAt),
      }));

      setMessages(parsed);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Fetch channel message counts
  const loadChannelCounts = async () => {
    try {
      const data = await fetchChannelMessageCountsAction();
      const countMap: Record<string, number> = {};
      data.forEach((c) => {
        countMap[c.channelId] = c.count;
      });
      setChannelCounts(countMap);
    } catch (err) {
      console.error("Error loading message counts:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [user, contactsData] = await Promise.all([
          getCurrentUserAction(),
          fetchChatContactsAction(),
        ]);
        setCurrentUser(user);
        setContacts(contactsData);
        await loadMessages(activeChannelId, false);
        await loadChannelCounts();
      } catch (err) {
        console.error("Failed to initialize messages panel:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Auto-refresh interval (polling) without hijacking scroll
    const interval = setInterval(() => {
      loadMessages(activeChannelId, false);
      loadChannelCounts();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeChannelId]);

  // Only scroll down when messages count changes or channel changes
  useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current) {
      scrollToBottom();
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText("");
    setIsSending(true);

    try {
      const activeConf = getActiveChannelConfig();
      const newMsg = await sendMessageAction(
        text,
        activeChannelId,
        activeConf.recipientId,
        activeConf.recipientName
      );

      setMessages((prev) => [
        ...prev,
        {
          id: newMsg.id,
          senderName: newMsg.senderName,
          senderAvatar: newMsg.senderAvatar,
          senderRole: newMsg.senderRole,
          content: newMsg.content,
          recipientName: newMsg.recipientName,
          isPrivate: newMsg.isPrivate,
          createdAt: new Date(newMsg.createdAt),
        },
      ]);

      setChannelCounts((prev) => ({
        ...prev,
        [activeChannelId]: (prev[activeChannelId] || 0) + 1,
      }));

      // Immediate scroll down on send
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const dmTeammates = contacts.squad.filter(
    (c) => c.name !== currentUser?.fullName && c.email !== currentUser?.email
  );

  // Search and Filter logic for list
  const matchesSearch = (name: string) => {
    if (!searchQuery.trim()) return true;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="h-[calc(100vh-3.5rem-3.75rem)] w-full flex flex-col md:flex-row bg-white overflow-hidden">
      
      {/* ── Left Panel: Chat & Channel List (WhatsApp / Slack Style) ── */}
      <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full border-r border-zinc-200 bg-zinc-50/70 shrink-0">
        
        {/* Top Header */}
        <div className="h-14 px-4 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-950 tracking-tight">Chats</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              Live
            </span>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-950">
                  <ListFilter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Filter Chats</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setFilterType("all")} className="text-xs cursor-pointer">
                    <MessageSquareDot className="w-3.5 h-3.5 mr-2" /> All Chats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("squad")} className="text-xs cursor-pointer">
                    <Shield className="w-3.5 h-3.5 mr-2 text-[#E61E32]" /> Squad Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("public")} className="text-xs cursor-pointer">
                    <Globe className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Public Channels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("dm")} className="text-xs cursor-pointer">
                    <User className="w-3.5 h-3.5 mr-2 text-purple-600" /> Direct Messages
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-200 bg-white/80 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-zinc-100 border-zinc-200 focus-visible:bg-white text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Channels & Contacts Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          
          {/* 1. SQUAD PRIVATE CHANNEL */}
          {(filterType === "all" || filterType === "squad") && matchesSearch(squadChannel.name) && (
            <button
              onClick={() => setActiveChannelId(squadChannel.id)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeChannelId === squadChannel.id
                  ? "bg-red-50/80 border-l-4 border-l-[#E61E32]"
                  : "hover:bg-zinc-100/70"
              }`}
            >
              <div className="size-10 rounded-full bg-red-100 text-[#E61E32] flex items-center justify-center font-bold text-sm shrink-0 border border-red-200">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900 truncate">#{squadChannel.name}</span>
                  <span className="text-[10px] font-bold text-[#E61E32] bg-red-100/70 px-1.5 py-0.5 rounded">
                    Squad
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">Private team sync room</p>
              </div>
            </button>
          )}

          {/* 2. PUBLIC CHANNELS */}
          {(filterType === "all" || filterType === "public") && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100/50">
                Public Channels
              </div>
              {publicChannels
                .filter((chan) => matchesSearch(chan.name))
                .map((chan) => {
                  const isActive = activeChannelId === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => setActiveChannelId(chan.id)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-50/80 border-l-4 border-l-emerald-600"
                          : "hover:bg-zinc-100/70"
                      }`}
                    >
                      <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-zinc-900 truncate">#{chan.name}</span>
                          {channelCounts[chan.id] !== undefined && (
                            <span className="text-[10px] font-medium text-zinc-400">
                              {channelCounts[chan.id]} msgs
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{chan.description}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* 3. DIRECT MESSAGES - TEAMMATES */}
          {(filterType === "all" || filterType === "dm") && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100/50 flex justify-between items-center">
                <span>Direct Messages</span>
                <span className="text-purple-600 text-[9px] font-extrabold">1-on-1</span>
              </div>
              
              {dmTeammates.length > 0 ? (
                dmTeammates
                  .filter((m) => matchesSearch(m.name))
                  .map((member) => {
                    const dmId = `dm_${member.id}`;
                    const isActive = activeChannelId === dmId;
                    return (
                      <button
                        key={member.id}
                        onClick={() => setActiveChannelId(dmId)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                          isActive
                            ? "bg-purple-50/80 border-l-4 border-l-purple-600"
                            : "hover:bg-zinc-100/70"
                        }`}
                      >
                        <Avatar className="size-10 shrink-0 border border-zinc-200">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          ) : null}
                          <AvatarFallback className="bg-purple-100 text-purple-800 text-xs font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-zinc-900 truncate">{member.name}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">{member.role}</p>
                        </div>
                      </button>
                    );
                  })
              ) : (
                <div className="px-4 py-3 text-xs text-zinc-400 italic">No other teammates in squad yet.</div>
              )}

              {/* Judges & Mentors */}
              {contacts.judges.length > 0 && (
                <>
                  <div className="px-4 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50/60 border-t border-b border-amber-100">
                    Jury & Mentors
                  </div>
                  {contacts.judges
                    .filter((j) => matchesSearch(j.name))
                    .map((judge) => {
                      const dmId = `dm_${judge.id}`;
                      const isActive = activeChannelId === dmId;
                      return (
                        <button
                          key={judge.id}
                          onClick={() => setActiveChannelId(dmId)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                            isActive
                              ? "bg-amber-50/80 border-l-4 border-l-amber-600"
                              : "hover:bg-zinc-100/70"
                          }`}
                        >
                          <Avatar className="size-10 shrink-0 border border-amber-200">
                            {judge.avatarUrl ? (
                              <AvatarImage src={judge.avatarUrl} alt={judge.name} />
                            ) : null}
                            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                              <Gavel className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-zinc-900 truncate">{judge.name}</span>
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                                Judge
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">Evaluation & Mentorship</p>
                          </div>
                        </button>
                      );
                    })}
                </>
              )}
            </div>
          )}

        </div>
      </aside>

      {/* ── Right Panel: Chat Conversation & Composition ── */}
      <section className="flex-1 flex flex-col h-full bg-zinc-50/40 relative overflow-hidden">
        
        {/* Chat Room Top Bar */}
        <div className="h-14 px-4 md:px-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-9 shrink-0 border border-zinc-200">
              {currentChannel.avatarUrl ? (
                <AvatarImage src={currentChannel.avatarUrl} />
              ) : null}
              <AvatarFallback className={`text-xs font-bold ${
                currentChannel.scope === "squad"
                  ? "bg-red-100 text-[#E61E32]"
                  : currentChannel.scope === "dm"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {currentChannel.scope === "squad" ? (
                  <Lock className="w-4 h-4" />
                ) : currentChannel.scope === "dm" ? (
                  currentChannel.name.charAt(0).toUpperCase()
                ) : (
                  <Hash className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-950 truncate">
                  {currentChannel.scope === "dm" ? currentChannel.name : `#${currentChannel.name}`}
                </h3>
                {currentChannel.scope === "squad" ? (
                  <span className="text-[9px] font-black bg-red-100 text-[#E61E32] px-2 py-0.5 rounded-full border border-red-200">
                    SQUAD PRIVATE
                  </span>
                ) : currentChannel.scope === "dm" ? (
                  <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    1-ON-1 DM
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    PUBLIC CHANNEL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
                {currentChannel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-950">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-950">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-950">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3.5 bg-zinc-50/50"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#E61E32] animate-spin" />
              <span className="text-xs text-zinc-400 font-medium mt-2">Loading messages...</span>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isSystem = msg.senderName === "System";
              const isMe = msg.senderName === currentUser?.fullName || msg.senderName === "You";

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center w-full my-2">
                    <span className="bg-white border border-zinc-200 text-zinc-600 text-[10px] font-medium px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-[#E61E32]" />
                      {renderSystemMessage(msg.content)}
                    </span>
                  </div>
                );
              }

              const bubbleTheme = getBubbleColors(msg.senderName, isMe);

              if (isMe) {
                return (
                  <div key={msg.id} className="flex justify-end w-full pl-12">
                    <div className="bg-[#E61E32] text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[80%] md:max-w-[70%] shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-1 border-b border-white/20 pb-0.5">
                        <span className="text-[10px] font-bold text-white/90">
                          {msg.senderName} (You)
                        </span>
                        <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                          {msg.senderRole}
                        </span>
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium break-words">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-[9px] text-white/75 font-normal">
                          {msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start w-full pr-12 gap-2.5 items-start">
                  <Avatar className="size-8 shrink-0 border border-zinc-200">
                    {msg.senderAvatar && (msg.senderAvatar.startsWith("http") || msg.senderAvatar.startsWith("/")) ? (
                      <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                    ) : null}
                    <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xs font-bold">
                      {msg.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[80%] md:max-w-[70%] shadow-xs">
                    <div className="flex items-center justify-between gap-3 mb-1 border-b border-zinc-100 pb-0.5">
                      <span className="text-[10px] font-bold text-zinc-900">
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium uppercase">
                        {msg.senderRole}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-800 leading-relaxed font-medium break-words">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-start mt-1">
                      <span className="text-[9px] text-zinc-400 font-normal">
                        {msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3">
                {currentChannel.scope === "squad" ? (
                  <Lock className="w-7 h-7 text-[#E61E32]" />
                ) : currentChannel.scope === "dm" ? (
                  <User className="w-7 h-7 text-purple-600" />
                ) : (
                  <Globe className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-zinc-900">
                {currentChannel.scope === "squad"
                  ? "Squad Private Channel is Ready"
                  : currentChannel.scope === "dm"
                  ? `Direct message with ${currentChannel.name}`
                  : `Welcome to #${currentChannel.name}`}
              </h4>
              <p className="text-xs text-zinc-500 font-normal mt-1 max-w-sm">
                {currentChannel.scope === "squad"
                  ? "Messages sent here are completely private to your team members."
                  : currentChannel.scope === "dm"
                  ? "Messages sent here are strictly confidential between you two."
                  : "Messages sent here are broadcast to all participants."}
              </p>
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-zinc-200 bg-white flex items-center gap-2 shrink-0">
          
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 shrink-0">
            <Smile className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-900 shrink-0">
                <Paperclip className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="text-xs cursor-pointer">
                <Image className="w-4 h-4 mr-2" /> Photos & Videos
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <Camera className="w-4 h-4 mr-2" /> Camera
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <File className="w-4 h-4 mr-2" /> Document
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <UserRound className="w-4 h-4 mr-2" /> Contact
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <ChartBarIncreasing className="w-4 h-4 mr-2" /> Poll
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs cursor-pointer">
                <Brush className="w-4 h-4 mr-2" /> Drawing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentChannel.scope === "squad"
                ? "Message your squad (Private)..."
                : currentChannel.scope === "dm"
                ? `Direct message ${currentChannel.name}...`
                : `Post to #${currentChannel.name}...`
            }
            className="flex-1 h-10 text-xs bg-zinc-50 border-zinc-200 focus-visible:bg-white rounded-lg shadow-2xs"
          />

          <Button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="h-10 px-4 bg-[#E61E32] hover:bg-[#c91527] text-white text-xs font-semibold rounded-lg shrink-0 gap-1.5 shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </form>

      </section>

    </div>
  );
}
