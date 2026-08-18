"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SoftAurora from "@/components/SoftAurora";
import { useRouter } from "next/navigation";

// I-IMPORT ANG FIREBASE AUTH FUNCTIONS
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  reaction?: string;
}

interface Conversation {
  id: number | string;
  name: string;
  email: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  messages: Message[];
}

export default function ChatPage() {
  const router = useRouter();

  // Session & Loading States
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Modal States
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  // UI Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // State para sa Mobile Long Press / Active Emoji Menu per Message ID
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Prototype Database State
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Angely",
      email: "angely@email.com",
      lastMessage: "Hello! Naka-connect naka?",
      time: "10:00 AM",
      isOnline: true,
      messages: [
        { id: 101, sender: "Angely", text: "Hello! Naka-connect naka?", time: "10:00 AM" }
      ]
    }
  ]);

  const [activeChatId, setActiveChatId] = useState<number | string | null>(null); 
  const [inputMessage, setInputMessage] = useState("");

  // =========================================================================
  // FIREBASE SESSION LISTENER (Proteksyon sa Page)
  // =========================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Naka-log in ang user, kuhaon nato ang email
        setCurrentUserEmail(user.email);
        setIsSessionLoading(false);
      } else {
        // Walay naka-log in, i-redirect pabalik sa landing/login page (/)
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleStartConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientEmail) return;
    
    setIsStartingChat(true);

    setTimeout(() => {
      setIsStartingChat(false);
      
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newChatId = Date.now();
      
      const newMessages: Message[] = initialMessage 
        ? [{ id: Date.now(), sender: "You", text: initialMessage, time: currentTime }] 
        : [];

      const newConversation: Conversation = {
        id: newChatId,
        name: recipientName,
        email: recipientEmail,
        lastMessage: initialMessage || "Started a new conversation...",
        time: currentTime,
        isOnline: true,
        messages: newMessages
      };

      setConversations([newConversation, ...conversations]);
      setActiveChatId(newChatId);

      const modal = document.getElementById('new_chat_modal') as HTMLDialogElement;
      modal?.close();
      setRecipientEmail("");
      setRecipientName("");
      setInitialMessage("");
    }, 800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || activeChatId === null) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: Date.now(),
      sender: "You",
      text: inputMessage,
      time: currentTime
    };

    setConversations(prevConversations =>
      prevConversations.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            lastMessage: inputMessage,
            time: currentTime,
            messages: [...chat.messages, newMessage]
          };
        }
        return chat;
      })
    );

    setInputMessage("");
  };

  const handleReactMessage = (messageId: number, emoji: string) => {
    if (activeChatId === null) return;

    setConversations(prevConversations =>
      prevConversations.map(chat => {
        if (chat.id === activeChatId) {
          const updatedMessages = chat.messages.map(msg => {
            if (msg.id === messageId) {
              return { ...msg, reaction: msg.reaction === emoji ? undefined : emoji };
            }
            return msg;
          });
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
    setActiveReactionMessageId(null);
  };

  // Handlers para sa Mobile Long Press Detection
  const handleTouchStart = (messageId: number) => {
    pressTimer.current = setTimeout(() => {
      setActiveReactionMessageId(messageId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  // =========================================================================
  // LOGOUT HANDLER (Firebase SignOut + Redirect)
  // =========================================================================
  const handleLogout = async () => {
    try {
      setIsProfileOpen(false);
      await signOut(auth); // Limpyohan ang session sa Firebase
      router.push('/logout');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddSenderEmail = () => {
    setIsProfileOpen(false);
    alert("Prototype: Feature to add extra sender email addresses.");
  };

  // Kung nag-load pa ang session check, ipakita muna ang loading screen
  if (isSessionLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0a0a0e] flex flex-col items-center justify-center text-white gap-3">
        <span className="loading loading-spinner loading-md text-pink-500"></span>
        <p className="text-xs text-white/50 tracking-wider uppercase">Loading session...</p>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.id === activeChatId);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0e] text-white flex font-sans">
      
      {/* 1. BLURRED AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0e]/60 backdrop-blur-[80px] z-10" />
        <SoftAurora 
          color1="#f7f7f7" 
          color2="#e100ff" 
          speed={0.3} 
          brightness={1.5}
          noiseFrequency={2.5}
          bandSpread={1}
          colorSpeed={1}
          scale={1.5}
        />
      </div>

      {/* MOBILE SIDEBAR BACKDROP */}
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

          {/* LIST SA CONVERSATIONS */}
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
                      ? "bg-white/15 text-white font-medium shadow-inner border border-white/10" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-full w-10 h-10 text-sm font-bold flex items-center justify-center shadow-md">
                      {chat.name.charAt(0)}
                    </div>
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#120F17] rounded-full"></span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold truncate leading-tight">{chat.name}</span>
                      <span className="text-[10px] text-white/40 shrink-0">{chat.time}</span>
                    </div>
                    <span className="text-xs text-white/40 truncate mt-0.5">{chat.lastMessage}</span>
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
                  JU
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#120F17] rounded-full"></span>
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-semibold text-white/90 leading-tight truncate">Junwell</span>
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
                  className="absolute bottom-full left-0 mb-3 w-full bg-[#141419] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <ul className="menu p-3 text-white/80 gap-1.5 relative z-50 w-full">
                    <li className="pointer-events-none mb-1 w-full">
                      <div className="flex flex-col items-center justify-center w-full px-2 py-2">
                        <span className="font-bold text-base text-white truncate">Junwell Alonzo</span>
                        <span className="text-xs text-white/50 truncate">{currentUserEmail || "junwell@email.com"}</span>
                      </div>
                    </li>
                    <div className="h-px w-full bg-white/10 my-1"></div>
                    <li className="w-full">
                      <button onClick={handleAddSenderEmail} className="hover:bg-white/10 hover:text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors w-full cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-sm">Add sender email</span>
                      </button>
                    </li>
                    <li className="w-full">
                      <button onClick={handleLogout} className="hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors w-full cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-sm">Logout</span>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                  {activeConversation.name.charAt(0)}
                </div>
                {activeConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0a0e] rounded-full"></span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white/90 leading-tight truncate">{activeConversation.name}</span>
                <span className="text-[10px] text-green-400 font-medium">Online</span>
              </div>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-white/40 font-medium truncate">No active conversation</span>
          )}
          
          <div className="w-10"></div>
        </header>

        {/* Chat Messages / Welcome Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto justify-center">
          {activeChatId !== null && activeConversation ? (
            activeConversation.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col w-full my-1 group relative ${
                  msg.sender === "You" ? "items-end" : "items-start"
                }`}
              >
                <div className="text-xs text-white/50 mb-1 px-1">
                  {msg.sender} <time className="text-[10px] opacity-50 ml-1">{msg.time}</time>
                </div>
                
                <div 
                  className="relative max-w-[85%] sm:max-w-md"
                  onTouchStart={() => handleTouchStart(msg.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className={`text-sm py-3 px-4 shadow-lg rounded-2xl ${
                    msg.sender === "You" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-sm" 
                      : "bg-white/10 backdrop-blur-md text-white rounded-tl-sm border border-white/10"
                  }`}>
                    {msg.text}

                    {msg.reaction && (
                      <span className="absolute -bottom-2.5 right-2 bg-[#1b1724] border border-white/10 text-xs px-2 py-0.5 rounded-full shadow-md">
                        {msg.reaction}
                      </span>
                    )}
                  </div>

                  {/* Hover Quick Emoji Bar (PC) / Active State (Mobile Long Press) */}
                  <div className={`absolute top-0 transition-opacity duration-200 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 shadow-xl z-30 ${
                    activeReactionMessageId === msg.id ? "opacity-100 flex" : "opacity-0 group-hover:opacity-100 hidden sm:flex"
                  } ${msg.sender === "You" ? "-left-48" : "-right-48"}`}>
                    <button onClick={() => handleReactMessage(msg.id, "❤️")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">❤️</button>
                    <button onClick={() => handleReactMessage(msg.id, "👍")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">👍</button>
                    <button onClick={() => handleReactMessage(msg.id, "😂")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">😂</button>
                    <button onClick={() => handleReactMessage(msg.id, "🔥")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">🔥</button>
                    <button onClick={() => handleReactMessage(msg.id, "😮")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">😮</button>
                    <button onClick={() => handleReactMessage(msg.id, "👀")} className="hover:scale-125 transition-transform text-sm cursor-pointer p-1">👀</button>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="text-center max-w-md mx-auto px-4">
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

        {/* Message Input Box */}
        {activeChatId !== null && (
          <div className="p-3 sm:p-4 bg-black/20 backdrop-blur-xl border-t border-white/5">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">
              <input 
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="input input-bordered flex-1 bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 rounded-2xl h-12 sm:h-14 px-4 sm:px-5 backdrop-blur-md text-sm sm:text-base"
              />
              <button 
                type="submit"
                className="btn bg-white hover:bg-gray-200 text-black border-none rounded-2xl h-12 sm:h-14 px-5 sm:px-6 font-semibold shadow-lg text-sm sm:text-base cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>

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