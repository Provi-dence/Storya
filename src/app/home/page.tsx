"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SoftAurora from "@/components/SoftAurora";
import { useRouter } from "next/navigation";
import BorderGlow from "@/components/BorderGlow";

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  reaction?: string;
  image?: string | null; 
}

interface Conversation {
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  time: string;
  updatedAt?: number;
  isOnline: boolean;
  status: "pending" | "accepted"; 
  invitedBy?: string;             
  messages: Message[];
  unreadCount?: number; 
  lastActive?: number;  
  mood?: string;
}

const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

const getActiveStatusText = (lastActive?: number, isOnline?: boolean) => {
  if (!lastActive) return "Offline";
  const seconds = Math.floor((Date.now() - lastActive) / 1000);
  
  if (seconds < 35 && isOnline) return "Online";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return "Offline";
};

const checkIsUserOnline = (lastActive?: number, isOnline?: boolean) => {
  if (!lastActive) return false;
  const seconds = Math.floor((Date.now() - lastActive) / 1000);
  return seconds < 35 && (isOnline !== false);
};

export default function ChatPage() {
  const router = useRouter();

  // Toaster & Invite Timer States para sa Recipient
  const [incomingInvite, setIncomingInvite] = useState<{ chatId: string; inviterName: string; inviterEmail: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // Profile Display Name States
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameUpdateMessage, setNameUpdateMessage] = useState("");

  // Session & Loading States (Cookie-Aware)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>("");
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Modal States
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  // Modals for Actions
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // UI Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Reaction States
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll refs & states
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Real Database State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); 
  const [inputMessage, setInputMessage] = useState("");

  // Users Presence Map Store
  const [usersPresence, setUsersPresence] = useState<{ [email: string]: { isOnline: boolean; lastActive: number; displayName: string } }>({});

  const activeConversation = conversations.find(c => c.id === activeChatId);

  // 1. State para sa napili nga image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 2. Function para mo-handle sa pag-upload/pagpili sa file
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Mo-convert ngadto sa Base64 string aron masave sa Firestore
        setSelectedImage(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };
  // ==========================================
  // AI MOOD DYNAMIC COLORS
  // ==========================================

type MoodType =
  | "romantic"
  | "heated"
  | "excited"
  | "serious"
  | "chill";




const normalizeMood = (mood?: string): MoodType => {
  const normalized = mood?.trim().toLowerCase();

  if (
    normalized === "romantic" ||
    normalized === "heated" ||
    normalized === "excited" ||
    normalized === "serious" ||
    normalized === "chill"
  ) {
    return normalized;
  }

  return "chill";
};





  // ==========================================
  // MOOD THEMES
  // ==========================================

  const allMoodThemes: Record<
    MoodType,
    {
      color1: string;
      color2: string;
      label: string;
      textClass: string;
      glowClass: string;
    }
  > = {
    romantic: {
      color1: "#ff477e",
      color2: "#ff70a6",
      label: "💖 Romantic",
      textClass: "text-pink-400",
      glowClass: "shadow-[0_0_15px_rgba(255,71,126,0.45)]"
    },

    heated: {
      color1: "#ff0000",
      color2: "#ff5400",
      label: "🔥 Heated",
      textClass: "text-red-400",
      glowClass: "shadow-[0_0_15px_rgba(255,0,84,0.45)]"
    },

    excited: {
      color1: "#e4c725",
      color2: "#eea443",
      label: "🎉 Excited",
      textClass: "text-purple-400",
      glowClass: "shadow-[0_0_15px_rgba(114,9,183,0.45)]"
    },

    serious: {
      color1: "#0ca358",
      color2: "#48ef48",
      label: "💼 Serious",
      textClass: "text-blue-400",
      glowClass: "shadow-[0_0_15px_rgba(58,12,163,0.45)]"
    },

    chill: {
      color1: "#52c9f8",
      color2: "#4365fc",
      label: "✨ Chill",
      textClass: "text-gray-400",
      glowClass: "shadow-[0_0_15px_rgba(225,0,255,0.20)]"
    }
  };


const currentMood = normalizeMood(activeConversation?.mood);
const moodTheme = allMoodThemes[currentMood];


  // ==========================================
  // SCROLL LOGIC & FLOATING BUTTON
  // ==========================================
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100; // Kung nilapas og 100px pataas
      setShowScrollButton(isScrolledUp);
    }
  };

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const prevMsgCount = useRef(0);
  const prevChatId = useRef<string | null>(null);

  useEffect(() => {
    if (activeConversation) {
      const currentMsgCount = activeConversation.messages.length;
      const isNewChat = prevChatId.current !== activeChatId;
      const hasNewMessages = currentMsgCount > prevMsgCount.current;
      
      if (isNewChat) {
        setTimeout(() => scrollToBottom("auto"), 50); // Instant scroll for new chat open
      } else if (hasNewMessages) {
        const lastMsg = activeConversation.messages[currentMsgCount - 1];
        const isMe = lastMsg?.sender === currentUserEmail;
        
        // Mo-scroll ra if ikaw ni-send OR if naa ka sa pinakaubos
        if (isMe || !showScrollButton) {
          setTimeout(() => scrollToBottom("smooth"), 50);
        }
      }
      
      prevMsgCount.current = currentMsgCount;
      prevChatId.current = activeChatId;
    }
  }, [activeConversation, activeChatId, currentUserEmail, showScrollButton]);

  // FIX: Mas nindot nga approach para dili mag-spam ang toaster matag chat
  const lastCheckedMessages = useRef<{ [chatId: string]: number }>({});
  const lastCheckedReactions = useRef<{ [chatId: string]: number }>({});
  const isInitialLoad = useRef(true);

  // HEARTBEAT PING (Matag 10 segundos)
  useEffect(() => {
    if (!currentUserEmail) return;
    const sendHeartbeat = () => {
      fetch('/api/presence', { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUserEmail]);

  // FETCH USERS PRESENCE MAP (Matag 5 segundos)
  useEffect(() => {
    if (!currentUserEmail) return;
    const fetchPresence = async () => {
      try {
        const res = await fetch('/api/presence');
        const data = await res.json();
        if (res.ok && data.success && data.users) {
          const map: any = {};
          data.users.forEach((u: any) => {
            map[u.email.toLowerCase().trim()] = {
              isOnline: u.isOnline,
              lastActive: u.lastActive,
              displayName: u.displayName
            };
          });
          setUsersPresence(map);
        }
      } catch (err) {}
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 5000);
    return () => clearInterval(interval);
  }, [currentUserEmail]);

  // Active chat read reset effect via API
  useEffect(() => {
    if (activeChatId && currentUserEmail) {
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_unread', chatId: activeChatId })
      }).catch(() => {});
    }
  }, [activeChatId, currentUserEmail]);

  // ==========================================
  // GLOWING TOAST NOTIFICATION STATES
  // ==========================================
  const [toastNotification, setToastNotification] = useState<{ 
    show: boolean; 
    sender: string; 
    message: string; 
    id?: number; 
    isReaction?: boolean; 
    emoji?: string; 
  } | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (toastNotification?.show) {
      const timer = setTimeout(() => setToastNotification(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  useEffect(() => {
    if (!incomingInvite) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIncomingInvite(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingInvite]);

  // =========================================================================
  // 1. SECURE API-BASED SESSION CHECKER
  // =========================================================================
  useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch('/api/check-session');
        const data = await res.json();

        if (res.ok && data.authenticated && data.email) {
          setCurrentUserEmail(data.email);
          setCurrentUid("cookie-user-id");
          setCurrentDisplayName(data.email.split('@')[0]);
          setDisplayNameInput(data.email.split('@')[0]);
          setIsSessionLoading(false);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Session verification error:", err);
        router.push("/");
      }
    }

    verifySession();
  }, [router]);


  // =========================================================================
  // FETCH CHATS & TRIGGER TOASTER NOTIFICATIONS (Messages & Reactions)
  // =========================================================================
  useEffect(() => {
  if (!currentUserEmail) return;

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const fetchedChats: Conversation[] = data.chats.map((chat: any) => {
          const otherEmail =
            chat.participants.find(
              (e: string) =>
                e.toLowerCase().trim() !==
                currentUserEmail.toLowerCase().trim()
            ) || chat.participants[0];

          const rawAssignedName =
            chat.names?.[otherEmail] || otherEmail;

          const userUnreadMap = chat.unreadCounts || {};
          const emailKey = currentUserEmail.toLowerCase().trim();
          const myUnreadCount = userUnreadMap[emailKey] || 0;

          const messages = chat.messages || [];
          const lastMsg = messages[messages.length - 1];

          // -----------------------------
          // NEW MESSAGE TOASTER
          // -----------------------------
          if (lastMsg) {
            const prevMsgId =
              lastCheckedMessages.current[chat.id];

            if (prevMsgId !== lastMsg.id) {
              lastCheckedMessages.current[chat.id] = lastMsg.id;

              if (
                lastMsg.sender !== currentUserEmail &&
                !isInitialLoad.current &&
                activeChatId !== chat.id
              ) {
                setToastNotification({
                  show: true,
                  sender: rawAssignedName,
                  message: lastMsg.text,
                  id: lastMsg.id,
                  isReaction: false,
                });
              }
            }
          }

          // -----------------------------
          // REACTION TOASTER
          // -----------------------------
          const reactionData = chat.latestReaction;

          if (
            reactionData &&
            reactionData.emoji &&
            reactionData.emoji !== ""
          ) {
            const prevRxTime =
              lastCheckedReactions.current[chat.id];

            if (prevRxTime !== reactionData.timestamp) {
              lastCheckedReactions.current[chat.id] =
                reactionData.timestamp;

              if (
                reactionData.reactor !== currentUserEmail &&
                !isInitialLoad.current &&
                activeChatId !== chat.id
              ) {
                setToastNotification({
                  show: true,
                  sender: rawAssignedName,
                  message: `reacted to your message "${reactionData.messageText || ""}"`,
                  id: reactionData.timestamp,
                  isReaction: true,
                  emoji: reactionData.emoji,
                });
              }
            }
          }

          // -----------------------------
          // PRESENCE
          // -----------------------------
          const cleanOtherEmail =
            otherEmail.toLowerCase().trim();

          const peerPresence =
            usersPresence[cleanOtherEmail];

          const peerOnline = peerPresence
            ? checkIsUserOnline(
                peerPresence.lastActive,
                peerPresence.isOnline
              )
            : false;

          const peerLastActive =
            peerPresence?.lastActive;

          // -----------------------------
          // IMPORTANT: MOOD
          // -----------------------------
          const mood = normalizeMood(chat.mood);

          return {
            id: chat.id,
            name: rawAssignedName,
            email: otherEmail,
            lastMessage: chat.lastMessage || "",
            time: chat.time || "",
            updatedAt: chat.updatedAt || 0,
            isOnline: peerOnline,
            lastActive: peerLastActive,
            status: chat.status || "accepted",
            invitedBy: chat.invitedBy || "",
            messages,
            unreadCount: myUnreadCount,

            // DYNAMIC MOOD FROM API
            mood,
          };
        });

        console.log(
          "MOODS FROM API:",
          data.chats.map((chat: any) => ({
            id: chat.id,
            mood: chat.mood,
          }))
        );

        fetchedChats.sort(
          (a, b) =>
            (b.updatedAt || 0) - (a.updatedAt || 0)
        );

        setConversations(fetchedChats);

        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error(
        "Error fetching chats via API:",
        error
      );
    }
  };

  fetchChats();

  const interval = setInterval(fetchChats, 3000);

  return () => clearInterval(interval);
}, [currentUserEmail, activeChatId, usersPresence]);


  // =========================================================================
  // 3. START NEW CONVERSATION VIA API
  // =========================================================================
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientEmail || !currentUserEmail) return;
    
    // Check if conversation with this email already exists
    const formattedRecipientEmail = recipientEmail.toLowerCase().trim();
    const existingConversation = conversations.find(c => c.email.toLowerCase().trim() === formattedRecipientEmail);
    
    if (existingConversation) {
      const modal = document.getElementById('new_chat_modal') as HTMLDialogElement;
      modal?.close();
      setShowDuplicateModal(true); 
      setRecipientEmail("");
      setRecipientName("");
      setInitialMessage("");
      return; 
    }

    setIsStartingChat(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_chat',
          recipientEmail: formattedRecipientEmail,
          recipientName,
          initialMessage
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveChatId(data.chatId);

        const inviteLink = `${window.location.origin}/home?email=${encodeURIComponent(formattedRecipientEmail)}&chatId=${data.chatId}`;
        
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formattedRecipientEmail,
            inviteLink: inviteLink,
            inviterEmail: currentUserEmail
          }),
        });
        
        const modal = document.getElementById('new_chat_modal') as HTMLDialogElement;
        modal?.close();
        setRecipientEmail("");
        setRecipientName("");
        setInitialMessage("");
      }
    } catch (error) {
      console.error("Error creating chat invite:", error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!incomingInvite || !currentUserEmail) return;
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', chatId: incomingInvite.chatId, status: 'accepted' })
      });
      setActiveChatId(incomingInvite.chatId);
      setIncomingInvite(null);
    } catch (error: any) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleRejectInvite = async () => {
    if (!incomingInvite) return;
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', chatId: incomingInvite.chatId, status: 'rejected' })
      });
      setIncomingInvite(null);
    } catch (error) {
      console.error("Error rejecting invite:", error);
      setIncomingInvite(null);
    }
  };

  // =========================================================================
  // UPDATE DISPLAY NAME VIA API
  // =========================================================================
  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim() || !currentUserEmail) return;

    setIsUpdatingName(true);
    setNameUpdateMessage("");

    try {
      const newName = displayNameInput.trim();
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_display_name', displayName: newName })
      });

      setCurrentDisplayName(newName);
      setNameUpdateMessage("Name updated successfully!");
      setTimeout(() => setNameUpdateMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating display name:", error);
      setNameUpdateMessage("Failed to update name.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  // =========================================================================
  // SEND MESSAGE VIA API
  // =========================================================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Siguroha nga dili mo-send kung blangko ang text UG walay picture
    if (!inputMessage.trim() && !selectedImage) return;

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chatId: activeChatId,
          messageText: inputMessage, // Siguroha nga 'inputMessage' ni kay mao ni ang state sa imong input field
          image: selectedImage       // Ang Base64 string sa picture
        })
      });

      if (response.ok) {
        // 2. I-clear ang input field ug ang picture preview inig human og send
        setInputMessage("");    
        setSelectedImage(null); 
      } else {
        console.error("Failed to send message:", await response.text());
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReactMessage = async (messageId: number, emoji: string) => {
    if (!activeChatId || !currentUserEmail) return;

    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react_message',
          chatId: activeChatId,
          messageId,
          emoji
        })
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
    setActiveReactionMessageId(null);
  };

  const handleTouchStart = (messageId: number) => {
    pressTimer.current = setTimeout(() => setActiveReactionMessageId(messageId), 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      }).catch(() => {});

      document.cookie = "moncher_session_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setCurrentUserEmail(null);
      setConversations([]);
      setIsProfileOpen(false);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddSenderEmail = () => {
    setIsProfileOpen(false);
    setShowComingSoonModal(true); 
  };

  if (isSessionLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0a0a0e] flex flex-col items-center justify-center text-white gap-3">
        <span className="loading loading-spinner loading-md text-pink-500"></span>
        <p className="text-xs text-white/50 tracking-wider uppercase">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0e] text-white flex font-sans">

      {/* ================= INCOMING INVITE TOASTER ================= */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-2rem)] max-w-md pointer-events-auto"
          >
            <div className="bg-[#1a1528]/95 border border-purple-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <span className="font-bold text-sm text-white">Chat Invitation</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full">
                  ⏱️ {timeLeft}s remaining
                </span>
              </div>
              <p className="text-xs text-white/70">
                <strong className="text-white">{incomingInvite.inviterName}</strong> ({incomingInvite.inviterEmail}) wants to start a conversation with you.
              </p>
              <div className="flex gap-2 mt-1">
                <button 
                  type="button"
                  onClick={handleAcceptInvite} 
                  className="btn btn-sm bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white flex-1 rounded-xl cursor-pointer font-semibold z-50 pointer-events-auto"
                >
                  Accept
                </button>
                <button 
                  type="button"
                  onClick={handleRejectInvite} 
                  className="btn btn-sm btn-outline border-white/20 text-white/70 hover:text-white flex-1 rounded-xl cursor-pointer z-50 pointer-events-auto"
                >
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= GLOWING INCOMING MESSAGE / REACTION TOAST ================= */}
      <AnimatePresence mode="wait">
        {toastNotification && toastNotification.show && (
          <motion.div
            key={toastNotification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-[9995] sm:w-full sm:max-w-sm pointer-events-auto cursor-pointer"
            onClick={() => setToastNotification(null)}
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#120F17"
              borderRadius={28}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated
              colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
              <div className="relative p-4 flex items-center z-[9997] gap-4 w-full h-full bg-[#0a0a0e] rounded-[14px]">
                
                <div className="relative w-10 h-10 shrink-0">
                  <div className="absolute inset-0 bg-pink-500 blur-md opacity-60 rounded-full animate-pulse"></div>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                    {toastNotification.sender.charAt(0).toUpperCase()}
                  </div>
                  
                  {toastNotification.isReaction && (
                    <div className="absolute -bottom-2 -right-2 text-sm bg-[#0a0a0e] rounded-full p-0.5 shadow-md border border-white/10 z-20 flex items-center justify-center min-w-[20px] min-h-[20px]">
                      {toastNotification.emoji}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0 text-left">
                  <span className="text-sm font-bold text-white truncate tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                    {toastNotification.sender} {toastNotification.isReaction && <span className="font-normal text-pink-400">{toastNotification.emoji}</span>}
                  </span>
                  <span className="text-xs text-white/70 truncate mt-0.5">
                    {toastNotification.message}
                  </span>
                </div>
                
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)] animate-ping absolute right-4 top-4"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 absolute right-4 top-4"></span>
              </div>
            </BorderGlow>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. BLURRED AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

        <AnimatePresence mode="sync">
          <motion.div
            key={currentMood}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: {
                duration: 1.5,
                ease: "easeInOut"
              }
            }}
            className="absolute inset-0"
          >
            <SoftAurora
              color1={moodTheme.color1}
              color2={moodTheme.color2}
              speed={
                currentMood === "heated"
                  ? 0.6
                  : currentMood === "chill"
                    ? 0.2
                    : 0.4
              }
              brightness={
                currentMood === "heated"
                  ? 1.8
                  : 1.5
              }
              noiseFrequency={2.5}
              bandSpread={1}
              colorSpeed={1}
              scale={1.5}
            />
          </motion.div>
        </AnimatePresence>

        {/* Less blur */}
        <div className="absolute inset-0 bg-[#0a0a0e]/35 backdrop-blur-[30px] z-10" />

      </div>


      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. GEMINI-STYLE SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 288 : 0 }} 
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className={`absolute md:relative z-40 h-full bg-[#120F17]/95 md:bg-black/25 border-r border-white/5 backdrop-blur-xl flex flex-col overflow-hidden shrink-0 shadow-2xl ${
          isSidebarOpen ? "left-0" : "-left-72 md:left-0"
        }`}
        style={{ borderRightWidth: isSidebarOpen ? 1 : 0 }}
      >
        <div className="w-72 h-full flex flex-col p-4 min-w-[18rem] relative">
          
          <div className="flex items-center gap-1.5 px-2 mb-6 mt-1 cursor-default">

            <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              WZZP CHT
            </h1>
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse mt-2 shadow-[0_0_12px_rgba(236,72,153,0.8)]"></div>
          </div>

          <button 
            onClick={() => (document.getElementById('new_chat_modal') as HTMLDialogElement)?.showModal()}
            className="btn w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl h-14 flex items-center justify-between px-4 shadow-sm backdrop-blur-md transition-all mb-6 cursor-pointer"
          >
            <span className="font-semibold text-sm">Add conversation</span>
            <span className="text-xl font-light">+</span>
          </button>

          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-2">
            Recent Chats
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto pb-4 flex-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-white/30 italic px-2">No conversations yet.</p>
            ) : (
              conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                    activeChatId === chat.id 
                      ? "bg-white/15 text-white shadow-inner border border-white/10" 
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full w-10 h-10 text-sm font-bold flex items-center justify-center shadow-md">
                      {chat.name.charAt(0).toUpperCase()}
                    </div>
                    {/* DYNAMIC SIDEBAR GREEN / GRAY DOT */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#120F17] rounded-full ${
                      chat.isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}></span>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm truncate ${
                        chat.unreadCount && chat.unreadCount > 0 ? "font-bold text-white" : "font-semibold text-white/90"
                      }`}>
                        {chat.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white font-medium">
                          {chat.updatedAt ? getTimeAgo(chat.updatedAt) : chat.time}
                        </span>
                        {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs truncate mt-0.5 ${
                      chat.unreadCount && chat.unreadCount > 0 
                        ? "font-bold text-white" 
                        : "text-white/60"
                    }`}>
                      {chat.status === "pending" ? "Pending invitation..." : chat.lastMessage}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* PROFILE MENU DROPDOWN */}
          <div className="relative w-full mt-auto pt-4 border-t border-white/5">
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="bg-gradient-to-tr from-purple-600 to-pink-600 text-neutral-content rounded-full w-9 h-9 shadow-lg flex items-center justify-center font-bold text-sm">
                  {currentDisplayName ? currentDisplayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#120F17] rounded-full"></span>
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-semibold text-white/90 leading-tight truncate">{currentDisplayName || "My Profile"}</span>
              </div>
              
              <motion.svg 
                animate={{ rotate: isProfileOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-white/50 shrink-0" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </motion.svg>
            </div>

            {isProfileOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
            )}

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute bottom-full left-0 mb-3 w-full bg-[#141419] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-3"
                >
                  <div className="flex flex-col items-center justify-center w-full px-2 py-1 mb-2">
                    <span className="font-bold text-base text-white truncate">{currentDisplayName}</span>
                    <span className="text-xs text-white/50 truncate">{currentUserEmail}</span>
                  </div>

                  <div className="h-px w-full bg-white/10 my-2"></div>

                  <form onSubmit={handleUpdateDisplayName} className="space-y-2 mb-2">
                    <label className="text-[10px] uppercase tracking-wider text-white/60 font-semibold px-1">
                      Set Display Name
                    </label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="Enter your name"
                        className="input input-bordered input-sm bg-black/40 border-white/10 text-white text-xs w-full rounded-xl focus:outline-none focus:border-purple-500"
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={isUpdatingName}
                        className="btn btn-sm bg-purple-600 hover:bg-purple-700 border-none text-white rounded-xl text-xs"
                      >
                        {isUpdatingName ? "..." : "Save"}
                      </button>
                    </div>
                    {nameUpdateMessage && (
                      <p className={`text-[10px] px-1 ${nameUpdateMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
                        {nameUpdateMessage}
                      </p>
                    )}
                  </form>

                  <div className="h-px w-full bg-white/10 my-1"></div>

                  <ul className="menu p-0 text-white/80 gap-1.5 w-full">
                    <li className="w-full">
                      <button onClick={handleAddSenderEmail} className="hover:bg-white/10 hover:text-white rounded-xl py-2 px-3 flex items-center justify-center gap-2 transition-colors w-full cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-xs">Add sender email</span>
                      </button>
                    </li>
                    <li className="w-full">
                      <button onClick={handleLogout} className="hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl py-2 px-3 flex items-center justify-center gap-2 transition-colors w-full cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-xs">Logout</span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* 3. MAIN CHAT AREA */}
      <main className="relative z-25 flex-1 h-full flex flex-col bg-transparent min-w-0">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-black/10 backdrop-blur-md">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-square btn-ghost hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {activeConversation ? (
            <div className="flex items-center gap-2.5 min-w-0 px-2 truncate">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {activeConversation.name.charAt(0).toUpperCase()}
                </div>
                {/* DYNAMIC HEADER GREEN / GRAY DOT */}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#0a0a0e] rounded-full ${
                  activeConversation.isOnline ? "bg-green-500" : "bg-gray-500"
                }`}></span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/90 leading-tight truncate">
                    {activeConversation.name}
                  </span>
                  
                  {/* AI MOOD BADGE NGA NA-APIL SA HEADER */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentMood}
                        initial={{
                          opacity: 0,
                          scale: 0.7,
                          y: -5,
                          filter: "blur(4px)",
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          filter: "blur(0px)",
                          color: moodTheme.color1,
                          boxShadow: `0 0 16px ${moodTheme.color1}55`,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.7,
                          y: 5,
                          filter: "blur(4px)",
                        }}
                        transition={{
                          duration: 0.45,
                          ease: "easeInOut",
                        }}
                        className="
                          text-[9px]
                          font-bold
                          px-2.5
                          py-1
                          rounded-full
                          bg-black/40
                          border
                          border-white/10
                          backdrop-blur-md
                          whitespace-nowrap
                          justify-content-middle
                        "
                      >
                        {moodTheme.label}
                      </motion.span>
                    </AnimatePresence>
                </div>

                {/* DYNAMIC HEADER STATUS TEXT */}
                <span className={`text-[10px] font-medium ${
                  activeConversation.isOnline ? "text-green-400" : "text-gray-400"
                }`}>
                  {getActiveStatusText(activeConversation.lastActive, activeConversation.isOnline)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-white/40 font-medium truncate">No active conversation</span>
          )}
          
          <div className="w-10"></div>
        </header>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col max-w-3xl w-full mx-auto"
        >
          <div className="flex flex-col gap-4 mt-auto">
            {activeChatId !== null && activeConversation ? (
              <>
                {activeConversation.messages.map((msg) => {
                  const isMe = msg.sender === currentUserEmail;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col w-full my-1 group relative ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="text-xs text-white/50 mb-1 px-1">
                        {isMe ? "You" : activeConversation.name} 
                        <time className={`text-[10px] opacity-50 ml-1 ${isMe ? "text-blue-400 font-bold" : ""}`}>
                          {msg.time} {isMe && "✓"}
                        </time>
                      </div>
                                            
                      <div 
                        className="relative max-w-[85%] sm:max-w-md"
                        onTouchStart={() => handleTouchStart(msg.id)}
                        onTouchEnd={handleTouchEnd}
                      >
                        <motion.div
                          className={`
                            relative
                            text-sm
                            py-3
                            px-4
                            shadow-lg
                            rounded-2xl
                            text-white
                            ${
                              isMe
                                ? "rounded-tr-sm"
                                : "bg-white/10 backdrop-blur-md rounded-tl-sm border border-white/10"
                            }
                          `}
                          animate={
                            isMe
                              ? {
                                  background: `linear-gradient(
                                    120deg,
                                    ${moodTheme.color1},
                                    ${moodTheme.color2},
                                    ${moodTheme.color1}
                                  )`,
                                  boxShadow: `
                                    0 8px 30px ${moodTheme.color1}35,
                                    0 0 20px ${moodTheme.color2}20
                                  `,
                                }
                              : undefined
                          }
                          transition={{
                            background: {
                              duration: 1.2,
                              ease: "easeInOut",
                            },
                            boxShadow: {
                              duration: 1.2,
                              ease: "easeInOut",
                            },
                          }}
                        >

                          {/* STRICT CHECK: I-display lang kung ang msg.image ay valid na Base64 data URL */}
                          {msg.image && typeof msg.image === 'string' && msg.image.startsWith('data:image') && (
                            <div className="mb-1.5">
                              <img 
                                src={msg.image} 
                                alt="Attachment" 
                                className="max-w-xs sm:max-w-sm rounded-xl object-cover shadow-sm"
                                style={{ maxHeight: '300px' }}
                              />
                            </div>
                          )} 
                          
                          {msg.text}

                          {msg.reaction && msg.reaction !== "" && (
                            <span className="absolute -bottom-2.5 right-2 bg-[#1b1724] border border-white/10 text-xs px-2 py-0.5 rounded-full shadow-md">
                              {msg.reaction}
                            </span>
                          )}
                        </motion.div>



                        {/* REACTION MENU */}
                        <div className={`absolute -top-12 transition-opacity duration-200 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 shadow-xl z-30 ${
                          activeReactionMessageId === msg.id ? "opacity-100 flex" : "opacity-0 md:group-hover:opacity-100 hidden md:flex"
                        } ${isMe ? "right-0" : "left-0"}`}>
                          <button onClick={() => handleReactMessage(msg.id, "❤️")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">❤️</button>
                          <button onClick={() => handleReactMessage(msg.id, "👍")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">👍</button>
                          <button onClick={() => handleReactMessage(msg.id, "😂")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">😂</button>
                          <button onClick={() => handleReactMessage(msg.id, "🔥")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">🔥</button>
                          <button onClick={() => handleReactMessage(msg.id, "😮")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">😮</button>
                          <button onClick={() => handleReactMessage(msg.id, "👀")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">👀</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center max-w-md mx-auto px-4 my-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-3xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm shadow-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">See your recent chat</h2>
                <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-6">
                  You have no active conversation selected. Pick one from your sidebar or start a new connection below.
                </p>
                <button 
                  onClick={() => (document.getElementById('new_chat_modal') as HTMLDialogElement)?.showModal()}
                  className="btn bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl px-6 h-12 backdrop-blur-md shadow-lg cursor-pointer"
                >
                  Start a new message +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FLOATING DOWN ARROW BUTTON */}
        <AnimatePresence>
          {showScrollButton && activeChatId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-24 right-6 sm:bottom-28 sm:right-10 z-50 flex items-center justify-center w-12 h-12 bg-[#120F17]/90 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
              </svg>
              {/* Gi-fix nato ang condition diri aron dili mo-render og '0' */}
              {(activeConversation?.unreadCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 border-2 border-[#120F17] rounded-full animate-bounce"></span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Message Input Box */}
        {activeChatId !== null && activeConversation && activeConversation.status === "accepted" && (
          <div className="p-3 sm:p-4 bg-black/20 backdrop-blur-xl border-t border-white/5 relative z-40 flex flex-col">
            
            {/* ================= IMAGE PREVIEW AREA ================= */}
            {selectedImage && (
              <div className="max-w-3xl mx-auto w-full pb-3 px-2">
                <div className="relative inline-block">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="h-24 w-24 object-cover rounded-xl border border-white/20 shadow-lg" 
                  />
                  <button 
                    type="button"
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* ================= INPUT FORM AREA ================= */}
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto w-full flex items-center gap-2 sm:gap-3">
              
              {/* HIDDEN FILE INPUT */}
              <input 
                type="file" 
                accept="image/*" 
                id="imageUpload" 
                className="hidden" 
                onChange={handleImageSelect} 
              />
              
              {/* ATTACH PICTURE BUTTON */}
              <label 
                htmlFor="imageUpload" 
                className="btn btn-circle btn-ghost bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white cursor-pointer h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0"
                title="Attach a photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </label>

              {/* TEXT INPUT */}
              <input 
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="input input-bordered flex-1 bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 rounded-2xl h-12 sm:h-14 px-4 sm:px-5 backdrop-blur-md text-sm sm:text-base min-w-0"
              />
              
              {/* SEND BUTTON */}
              <button 
                type="submit"
                disabled={!inputMessage.trim() && !selectedImage}
                className="btn bg-white hover:bg-gray-200 text-black border-none rounded-2xl h-12 sm:h-14 px-5 sm:px-6 font-semibold shadow-lg text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:bg-white/50"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
      
      {/* ================= DUPLICATE EMAIL MODAL (BORDER GLOW) ================= */}
      <AnimatePresence>
        {showDuplicateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDuplicateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="max-w-sm w-full"
            >
              <BorderGlow
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#120F17"
                borderRadius={28}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={true}
                colors={['#ef4444', '#f97316', '#eab308']}
              >
                <div className="p-8 text-center flex flex-col items-center gap-4 text-white">
                  <div className="w-16 h-16 bg-gradient-to-tr from-orange-500/20 to-red-500/20 border border-white/10 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-3xl drop-shadow-md">⚠️</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                    Email Exists
                  </h2>
                  
                  <p className="text-white/60 text-sm leading-relaxed">
                    You already have an existing conversation with this email. Please check your recent chats sidebar.
                  </p>
                  
                  <button
                    onClick={() => setShowDuplicateModal(false)}
                    className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-medium text-sm w-full active:scale-95 cursor-pointer"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </BorderGlow>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= COMING SOON MODAL (BORDER GLOW) ================= */}
      <AnimatePresence>
        {showComingSoonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowComingSoonModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="max-w-sm w-full"
            >
              <BorderGlow
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#120F17"
                borderRadius={28}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={true}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
              >
                <div className="p-8 text-center flex flex-col items-center gap-4 text-white">
                  <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-white/10 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-3xl drop-shadow-md">🚀</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Coming Soon
                  </h2>
                  
                  <p className="text-white/60 text-sm leading-relaxed">
                    We're still cooking up the ability to add extra sender emails. Stay tuned for the next update!
                  </p>
                  
                  <button
                    onClick={() => setShowComingSoonModal(false)}
                    className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-medium text-sm w-full active:scale-95 cursor-pointer"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </BorderGlow>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ADD CONVERSATION ================= */}
      <dialog id="new_chat_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md bg-black/60 z-50">
        <div className="modal-box bg-[#141419] border border-white/10 text-white shadow-2xl rounded-t-[2rem] rounded-b-none sm:rounded-3xl p-6 sm:p-8">
          
          <h3 className="font-bold text-2xl mb-1 text-white">New Conversation</h3>
          <p className="text-white/50 text-sm mb-6">Enter the details of the person you want to chat with.</p>

          <form onSubmit={handleStartConversation} className="space-y-4">
            <div>
              <label className="label text-[11px] uppercase tracking-wider text-white/60 font-semibold px-1 pb-1">
                Recipient Name
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Angely" 
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="input input-bordered w-full bg-black/40 border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 rounded-xl"
              />
            </div>

            <div>
              <label className="label text-[11px] uppercase tracking-wider text-white/60 font-semibold px-1 pb-1">
                Recipient Email
              </label>
              <input 
                type="email" 
                required
                placeholder="e.g. angely@email.com" 
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="input input-bordered w-full bg-black/40 border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 rounded-xl"
              />
            </div>

            <div>
              <label className="label text-[11px] uppercase tracking-wider text-white/60 font-semibold px-1 pb-1 flex justify-between">
                <span>Message</span>
                <span className="text-white/30 font-normal normal-case tracking-normal">Optional</span>
              </label>
              <textarea 
                placeholder="Say hello..." 
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="textarea textarea-bordered w-full bg-black/40 border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-purple-500 rounded-xl h-24 resize-none"
              ></textarea>
            </div>

            <div className="modal-action mt-8 flex gap-3 m-0">
              <button 
                type="button" 
                onClick={() => (document.getElementById('new_chat_modal') as HTMLDialogElement)?.close()}
                className="btn btn-outline border-white/10 text-white/70 hover:text-white hover:bg-white/10 flex-1 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={isStartingChat}
                className="btn bg-white text-black hover:bg-gray-200 border-none flex-1 rounded-xl font-semibold shadow-lg cursor-pointer"
              >
                {isStartingChat ? (
                  <span className="loading loading-spinner loading-sm text-black"></span>
                ) : (
                  "Start Chat"
                )}
              </button>
            </div>
          </form>
        </div>
        
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

    </div>
  );
}