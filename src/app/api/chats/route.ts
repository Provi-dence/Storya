import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';


import crypto from 'crypto';
import OpenAI from 'openai';
import { InferenceClient } from "@huggingface/inference";


// ==========================================
// HUGGING FACE CLIENT
// ==========================================
const hfClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_KEY,
});


// ==========================================
// NATIVE NODE.JS ENCRYPTION HELPERS (WALA NAY I-INSTALL)
// ==========================================
const SECRET_KEY = process.env.NEXT_PUBLIC_CHAT_SECRET || "wazzap-chat-super-secure-key-2026";
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();
const IV_LENGTH = 16;

function encrypt(text: string) {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (e) {
    return text;
  }
}

function decrypt(text: string) {
  if (!text) return "";
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; 
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    // Gi-fix nato diri: i-convert dayon sa .toString('utf8')
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return text; 
  }
}

// ==========================================
// AI MOOD PREDICTOR (QWEN 3 4B)
// ==========================================
async function getHuggingFaceChatMood(conversationText: string) {
  if (!conversationText || !conversationText.trim()) {
    return "chill";
  }

  try {
    console.log("🤖 Sending conversation to Qwen...");

    const response = await hfClient.chat.completions.create({
      model: "Qwen/Qwen3-4B-Instruct-2507",
      messages: [
        {
          role: "system",
          content: `
You are a chat mood classification assistant.

Analyze the conversation and determine the DOMINANT mood.

You MUST reply with exactly ONE of these words:

romantic
heated
excited
serious
chill

Rules:
- romantic = love, affection, flirting, missing someone, sweet messages
- heated = angry, arguing, fighting, hostile or tense messages
- excited = very happy, enthusiastic, celebrating, energetic
- serious = important, formal, concerned or thoughtful conversation
- chill = casual, normal, relaxed conversation

Reply with ONLY ONE WORD.
No punctuation.
No explanation.
No extra text.
          `.trim(),
        },
        {
          role: "user",
          content: conversationText,
        },
      ],
      max_tokens: 5,
      temperature: 0.1,
    });

    const aiReply =
      response.choices[0]?.message?.content
        ?.trim()
        .toLowerCase() || "";

    console.log("🤖 Qwen raw response:", aiReply);

    const validMoods = [
      "romantic",
      "heated",
      "excited",
      "serious",
      "chill",
    ];

    const detectedMood = validMoods.find(
      (mood) => aiReply === mood
    );

    if (detectedMood) {
      console.log("🔥 AI DETECTED MOOD:", detectedMood);
      return detectedMood;
    }

    console.warn(
      "⚠️ Qwen returned unexpected mood:",
      aiReply
    );

    return "chill";

  } catch (error: any) {
    console.error(
      "❌ Hugging Face Qwen Error:",
      error?.message || error
    );

    return "chill";
  }
}


// ==========================================
// GET: Fetch Chats 
// ==========================================
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('moncher_session_email');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserEmail = sessionCookie.value.toLowerCase().trim();
    const querySnapshot = await getDocs(collection(db, "chats"));
    const chats: any[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const participants = data.participants || [];
      const lowerParticipants = participants.map((p: string) => p.toLowerCase().trim());
      const invitedBy = (data.invitedBy || "").toLowerCase().trim();

      if (lowerParticipants.includes(currentUserEmail) || invitedBy === currentUserEmail) {
        const decryptedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          text: decrypt(msg.text)
        }));
        
        chats.push({
          id: docSnap.id,
          ...data,
          lastMessage: decrypt(data.lastMessage || ""),
          messages: decryptedMessages,
          mood: data.mood || "chill" // Basahon ang na-save nga mood sa database
        });
      }
    });

    return NextResponse.json({ success: true, chats });
  } catch (error: any) {
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
    const { action, recipientEmail, recipientName, initialMessage, chatId, messageText, status, messageId, emoji, displayName, image } = body;



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

      if (!chatSnap.exists()) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

      const chatData = chatSnap.data();
      const existingMessages = chatData.messages || [];
      
      // 1. I-grab ang last few messages ug ang bag-ong message aron basahon sa AI
      const recentMessages = existingMessages.slice(-3).map((m: any) => decrypt(m.text));
      recentMessages.push(messageText); 
      const conversationText = recentMessages.join(" | ");

      // 2. Tawgon ang AI aron i-analyze ang mood sa panagsultianay
      const detectedMood = await getHuggingFaceChatMood(conversationText);
      console.log("🔥 AI DETECTED MOOD:", detectedMood);

      // 3. I-encrypt ang message ug i-save sa database apil ang bag-ong mood
      const encryptedText = encrypt(messageText);
      const currentTimeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });

      const newMessage = {
        id: Date.now(),
        sender: currentUserEmail,
        text: encryptedText,
        image: image || null,
        time: currentTimeStr
      };

      const unreadCounts = chatData.unreadCounts || {};
      const otherEmail = (chatData.participants || []).find((e: string) => e !== currentUserEmail);
      if (otherEmail) unreadCounts[otherEmail.toLowerCase().trim()] = (unreadCounts[otherEmail.toLowerCase().trim()] || 0) + 1;
      unreadCounts[currentUserEmail.toLowerCase().trim()] = 0;

      await updateDoc(chatRef, {
        messages: [...existingMessages, newMessage],
        lastMessage: encryptedText,
        time: currentTimeStr,
        updatedAt: Date.now(),
        unreadCounts: unreadCounts,
        mood: detectedMood // Gi-save na nato ang mood sa Firestore!
      });

      return NextResponse.json({ success: true, mood: detectedMood });
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
          reactedMessageText = decrypt(msg.text); // I-decrypt para sa notification/latest reaction kung kinahanglan
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