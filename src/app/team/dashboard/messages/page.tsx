"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Hash,
  Users,
  Shield,
  Lock,
  Globe,
  User,
  MessageSquare,
  Loader2,
  Sparkles,
  Info,
  Gavel
} from "lucide-react";
import {
  fetchMessagesAction,
  sendMessageAction,
  fetchChannelMessageCountsAction,
  getCurrentUserAction,
  fetchChatContactsAction,
} from "../../../actions/team-feature-actions";

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
      bg: "bg-red-50/70",
      border: "border-red-200",
      senderText: "text-[#E61E32]",
    };
  }

  const themes = [
    { bg: "bg-sky-50/70", border: "border-sky-200", senderText: "text-sky-700" },
    { bg: "bg-purple-50/70", border: "border-purple-200", senderText: "text-purple-700" },
    { bg: "bg-emerald-50/70", border: "border-emerald-200", senderText: "text-emerald-700" },
    { bg: "bg-amber-50/70", border: "border-amber-200", senderText: "text-amber-700" },
    { bg: "bg-teal-50/70", border: "border-teal-200", senderText: "text-teal-700" },
    { bg: "bg-rose-50/70", border: "border-rose-200", senderText: "text-rose-700" },
    { bg: "bg-blue-50/70", border: "border-blue-200", senderText: "text-blue-700" },
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
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string; avatarUrl: string | null } | null>(null);
  const [contacts, setContacts] = useState<{ squad: ChatContact[]; judges: ChatContact[] }>({ squad: [], judges: [] });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Static Public Channels
  const publicChannels: Channel[] = [
    {
      id: "announcements",
      name: "announcements",
      description: "Official broadcasts from Hackathon Organizers (Public to all participants)",
      scope: "public",
    },
    {
      id: "public-general",
      name: "public-lounge",
      description: "Public hackathon chat for networking across all registered teams",
      scope: "public",
    },
    {
      id: "tech-support",
      name: "tech-support",
      description: "Ask questions to mentors, tech crew, and event staff (Public)",
      scope: "public",
    },
  ];

  // Squad Private Channel
  const squadChannel: Channel = {
    id: "team-squad",
    name: "squad-sync",
    description: "Private team sync room — Strictly confidential to your team members",
    scope: "squad",
  };

  // Find active channel configuration (or dynamically create DM channel config)
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
        description: `Confidential 1-on-1 conversation with ${target?.name || "recipient"}. Visible only to you two.`,
        scope: "dm",
        recipientId: target?.id || targetId,
        recipientName: target?.name || "Direct Recipient",
      };
    }

    return squadChannel;
  };

  const currentChannel = getActiveChannelConfig();

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages from backend
  const loadMessages = async (channelId: string, showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const activeConf = getActiveChannelConfig();
      const data = await fetchMessagesAction(channelId, activeConf.recipientId);
      setMessages(
        data.map((msg) => ({
          id: msg.id,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          senderRole: msg.senderRole,
          content: msg.content,
          recipientName: msg.recipientName,
          isPrivate: msg.isPrivate,
          createdAt: new Date(msg.createdAt),
        }))
      );
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

  // Initialize
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

    // Auto-refresh interval every 3 seconds for live chat feel
    const interval = setInterval(() => {
      loadMessages(activeChannelId, false);
      loadChannelCounts();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom();
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
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Filter out current user from direct message list
  const dmTeammates = contacts.squad.filter(
    (c) => c.name !== currentUser?.fullName && c.email !== currentUser?.email
  );

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-14px-60px-44px)] bg-zinc-50 border-t border-zinc-200">
      
      {/* ── Channel & DM Sidebar ── */}
      <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#E61E32]" />
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">HackOS Chat Hub</h3>
          </div>
          <span className="text-[10px] bg-zinc-200/70 text-zinc-600 px-2 py-0.5 font-bold uppercase rounded-full">
            Role-Scoped
          </span>
        </div>
        
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          
          {/* 1. SQUAD PRIVATE SYNC */}
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <Lock className="w-3 h-3 text-[#E61E32]" />
              <span>Squad Private Sync</span>
            </div>
            <div className="mt-1 space-y-1">
              <button
                onClick={() => setActiveChannelId(squadChannel.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-tight transition-all cursor-pointer border ${
                  activeChannelId === squadChannel.id
                    ? "bg-red-50 text-[#E61E32] border-red-200 shadow-sm"
                    : "text-zinc-700 bg-zinc-50/50 border-transparent hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Shield className={`w-3.5 h-3.5 shrink-0 ${activeChannelId === squadChannel.id ? "text-[#E61E32]" : "text-zinc-500"}`} />
                <span className="truncate flex-1 text-left font-bold">{squadChannel.name}</span>
                <span className="text-[9px] bg-red-100/80 text-[#E61E32] px-1.5 py-0.5 rounded font-black uppercase">
                  Squad Only
                </span>
              </button>
            </div>
          </div>

          {/* 2. PUBLIC HACKATHON BROADCASTS */}
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>Public Hackathon Channels</span>
            </div>
            <div className="mt-1 space-y-1">
              {publicChannels.map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-tight transition-all cursor-pointer border ${
                    activeChannelId === chan.id
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm"
                      : "text-zinc-650 bg-white border-transparent hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Hash className={`w-3.5 h-3.5 shrink-0 ${activeChannelId === chan.id ? "text-emerald-600" : "text-zinc-400"}`} />
                  <span className="truncate flex-1 text-left">{chan.name}</span>
                  <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold">
                    {channelCounts[chan.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. DIRECT 1-ON-1 MESSAGES */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-purple-600" />
                <span>Direct Messages (1-on-1)</span>
              </div>
              <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.2 rounded">Private</span>
            </div>
            
            <div className="mt-1 space-y-1">
              {dmTeammates.length > 0 ? (
                dmTeammates.map((member) => {
                  const dmId = `dm_${member.id}`;
                  const isActive = activeChannelId === dmId;
                  return (
                    <button
                      key={member.id}
                      onClick={() => setActiveChannelId(dmId)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-tight transition-all cursor-pointer border ${
                        isActive
                          ? "bg-purple-50 text-purple-800 border-purple-200 shadow-sm"
                          : "text-zinc-650 bg-white border-transparent hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate flex-1 text-left">
                        <div className="truncate">{member.name}</div>
                        <div className="text-[9px] text-zinc-400 font-normal">{member.role}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Teammate Online" />
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-[11px] text-zinc-400 italic">
                  No other teammates in squad yet.
                </div>
              )}

              {/* Judges / Mentors DMs */}
              {contacts.judges.length > 0 && (
                <div className="pt-2">
                  <div className="px-2 py-0.5 text-[9px] font-bold text-zinc-400 uppercase">Jury / Mentors</div>
                  {contacts.judges.map((judge) => {
                    const dmId = `dm_${judge.id}`;
                    const isActive = activeChannelId === dmId;
                    return (
                      <button
                        key={judge.id}
                        onClick={() => setActiveChannelId(dmId)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold tracking-tight transition-all cursor-pointer border ${
                          isActive
                            ? "bg-purple-50 text-purple-800 border-purple-200 shadow-sm"
                            : "text-zinc-650 bg-white border-transparent hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Gavel className="w-3 h-3" />
                        </div>
                        <div className="truncate flex-1 text-left">
                          <div className="truncate">{judge.name}</div>
                          <div className="text-[9px] text-zinc-400 font-normal">Judge / Jury</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </nav>
        
        {/* Privacy Scoping Notice */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50/80 text-[10px] text-zinc-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#E61E32] shrink-0" />
          <span>RBAC privacy enforced. Messages strictly isolated by channel scope.</span>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <section className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
        
        {/* Chat Header with Visibility Banner */}
        <div className="p-4 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0 bg-zinc-50/40">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {currentChannel.scope === "squad" ? (
                <Lock className="w-4 h-4 text-[#E61E32]" />
              ) : currentChannel.scope === "dm" ? (
                <User className="w-4 h-4 text-purple-600" />
              ) : (
                <Globe className="w-4 h-4 text-emerald-600" />
              )}
              <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
                {currentChannel.scope === "dm" ? currentChannel.name : `#${currentChannel.name}`}
              </h4>

              {/* Scope Badge */}
              {currentChannel.scope === "squad" ? (
                <span className="text-[10px] font-extrabold bg-red-100 text-[#E61E32] px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  SQUAD PRIVATE
                </span>
              ) : currentChannel.scope === "dm" ? (
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  1-ON-1 DIRECT MESSAGE
                </span>
              ) : (
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  PUBLIC TO ALL TEAMS
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-normal">
              {currentChannel.description}
            </p>
          </div>

          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>

        {/* Message Logs Pane */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-zinc-50/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#E61E32] animate-spin" />
              <span className="text-xs text-zinc-400 font-bold mt-2">Loading scoped messages...</span>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isSystem = msg.senderName === "System";
              const isMe = msg.senderName === currentUser?.fullName || msg.senderName === "You";

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center w-full my-2 animate-in fade-in duration-200">
                    <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-semibold px-3 py-1 rounded-full tracking-wide flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-[#E61E32]" />
                      {renderSystemMessage(msg.content)}
                    </span>
                  </div>
                );
              }

              const bubbleTheme = getBubbleColors(msg.senderName, isMe);

              if (isMe) {
                return (
                  <div key={msg.id} className="flex justify-end w-full pl-12 animate-in fade-in duration-200">
                    <div className={`${bubbleTheme.bg} border ${bubbleTheme.border} rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[80%] md:max-w-[70%] shadow-sm relative`}>
                      <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-zinc-200/50 pb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${bubbleTheme.senderText}`}>
                          {msg.senderName} (You)
                        </span>
                        <span className="text-[9px] bg-red-100 text-[#E61E32] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          {msg.senderRole}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-800 leading-relaxed font-semibold break-words">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1.5">
                        <span className="text-[9px] text-zinc-400 font-bold">
                          {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start w-full pr-12 gap-3 items-start animate-in fade-in duration-200">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-300 shrink-0 select-none flex items-center justify-center bg-zinc-200">
                    {msg.senderAvatar && (msg.senderAvatar.startsWith("http") || msg.senderAvatar.startsWith("/")) ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-xs text-zinc-700">
                        {msg.senderAvatar || msg.senderName.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className={`${bubbleTheme.bg} border ${bubbleTheme.border} rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[80%] md:max-w-[70%] shadow-sm relative`}>
                    <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-zinc-200/50 pb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${bubbleTheme.senderText}`}>
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] bg-zinc-200/70 text-zinc-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                        {msg.senderRole}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-800 leading-relaxed font-medium break-words">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-start gap-1 mt-1.5">
                      <span className="text-[9px] text-zinc-400 font-bold">
                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3">
                {currentChannel.scope === "squad" ? (
                  <Lock className="w-8 h-8 text-[#E61E32]" />
                ) : currentChannel.scope === "dm" ? (
                  <User className="w-8 h-8 text-purple-600" />
                ) : (
                  <Globe className="w-8 h-8 text-emerald-600" />
                )}
              </div>
              <h5 className="text-sm font-bold text-zinc-800">
                {currentChannel.scope === "squad"
                  ? "Squad Private Channel is Ready"
                  : currentChannel.scope === "dm"
                  ? `Direct message with ${currentChannel.name}`
                  : `Welcome to #${currentChannel.name}`}
              </h5>
              <p className="text-xs text-zinc-500 font-normal mt-1 max-w-sm">
                {currentChannel.scope === "squad"
                  ? "Messages sent here are completely private to members of your squad only."
                  : currentChannel.scope === "dm"
                  ? "Messages sent here can only be seen by you and this person."
                  : "Messages sent here are broadcasted to all registered participants in this hackathon."}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composition Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 bg-white flex gap-3 items-center shrink-0">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentChannel.scope === "squad"
                  ? "Message your squad (Private)..."
                  : currentChannel.scope === "dm"
                  ? `Direct message ${currentChannel.name} (Private)...`
                  : `Post to #${currentChannel.name} (Public to all)...`
              }
              className="w-full bg-zinc-50 hover:bg-zinc-100/60 border border-zinc-200 focus:bg-white focus:outline-none focus:border-[#E61E32] text-xs px-4 py-3 rounded-none font-medium transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="bg-[#E61E32] hover:bg-[#c91527] disabled:opacity-50 border border-[#c91527] text-white px-5 py-3 rounded-none flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-bold text-xs"
            title="Send Message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </section>
      
    </div>
  );
}

