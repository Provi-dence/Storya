import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

// GET: Kuhaon ang tanang chats gamit ang standard SDK
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('moncher_session_email');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserEmail = sessionCookie.value.toLowerCase().trim();
    console.log("🔍 FETCHING CHATS FOR:", currentUserEmail);

    // Kuhaon ang tanang documents sa chats collection
    const querySnapshot = await getDocs(collection(db, "chats"));
    const chats: any[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const participants = data.participants || [];
      const lowerParticipants = participants.map((p: string) => p.toLowerCase().trim());
      const invitedBy = (data.invitedBy || "").toLowerCase().trim();

      // I-check kung ang current user kay apil sa chat
      if (lowerParticipants.includes(currentUserEmail) || invitedBy === currentUserEmail) {
        chats.push({
          id: docSnap.id,
          ...data
        });
      }
    });

    console.log("📦 FOUND CHATS COUNT:", chats.length);
    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
    console.error("API Get Chats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Actions (Start chat, Send message, etc.)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('moncher_session_email');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserEmail = sessionCookie.value.toLowerCase().trim();
    const body = await request.json();
    const { action, recipientEmail, recipientName, initialMessage, chatId, messageText, status, messageId, emoji, displayName } = body;



    // 1. START CHAT
    if (action === 'start_chat') {
      const formattedRecipientEmail = recipientEmail.toLowerCase().trim();
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newChatData = {
        participants: [currentUserEmail, formattedRecipientEmail],
        names: {
          [currentUserEmail]: currentUserEmail.split('@')[0],
          [formattedRecipientEmail]: recipientName
        },
        status: "pending",
        invitedBy: currentUserEmail,
        lastMessage: initialMessage || "Sent a conversation invite...",
        time: currentTimeStr,
        updatedAt: Date.now(),
        messages: initialMessage ? [{
          id: Date.now(),
          sender: currentUserEmail,
          text: initialMessage,
          time: currentTimeStr
        }] : [],
        unreadCounts: {}
      };

      const docRef = await addDoc(collection(db, "chats"), newChatData);
      return NextResponse.json({ success: true, chatId: docRef.id });
    }

    // 2. SEND MESSAGE
    if (action === 'send_message') {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      const chatData = chatSnap.data();
      const participants = chatData.participants || [];
      const otherEmail = participants.find((e: string) => e !== currentUserEmail);
      const unreadCounts = chatData.unreadCounts || {};

      if (otherEmail) {
        const otherKey = otherEmail.toLowerCase().trim();
        unreadCounts[otherKey] = (unreadCounts[otherKey] || 0) + 1;
      }
      unreadCounts[currentUserEmail.toLowerCase().trim()] = 0;

      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMessage = {
        id: Date.now(),
        sender: currentUserEmail,
        text: messageText,
        time: currentTimeStr
      };

      const existingMessages = chatData.messages || [];

      await updateDoc(chatRef, {
        messages: [...existingMessages, newMessage],
        lastMessage: messageText,
        time: currentTimeStr,
        updatedAt: Date.now(),
        unreadCounts: unreadCounts
      });

      return NextResponse.json({ success: true });
    }

    // 3. UPDATE STATUS (Accept/Reject)
    if (action === 'update_status') {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        status: status,
        updatedAt: Date.now()
      });
      return NextResponse.json({ success: true });
    }

    // 4. RESET UNREAD
    if (action === 'reset_unread') {
      const chatRef = doc(db, "chats", chatId);
      const emailKey = currentUserEmail.toLowerCase().trim();
      await updateDoc(chatRef, {
        [`unreadCounts.${emailKey}`]: 0
      });
      return NextResponse.json({ success: true });
    }

    // 5. REACT MESSAGE
    if (action === 'react_message') {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

      const chatData = chatSnap.data();
      let reactedMessageText = "";
      let newReaction = "";

      const updatedMessages = (chatData.messages || []).map((msg: any) => {
        if (msg.id === messageId) {
          newReaction = msg.reaction === emoji ? "" : emoji;
          reactedMessageText = msg.text;
          return { ...msg, reaction: newReaction };
        }
        return msg;
      });

      await updateDoc(chatRef, {
        messages: updatedMessages,
        latestReaction: {
          emoji: newReaction,
          reactor: currentUserEmail,
          messageText: reactedMessageText,
          timestamp: Date.now()
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("API Chat Action Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  
}