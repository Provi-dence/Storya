"use client";

import SoftAurora from "@/components/SoftAurora";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

// I-IMPORT ANG FIREBASE AUTH FUNCTIONS
import { auth } from "@/lib/firebase"; 

export default function LogoutPage() {

  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // =========================================================================
  // AUTO-REDIRECT KUNG NAKA-LOG IN NA DAAN ANG USER
  // =========================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kung naka-log in na, ayaw na i-pakita ang login page, idiretso sa home/chat
        router.push('/home');
      } else {
        // Kung wala, padayunon pagpakita ang login landing page
        setIsCheckingSession(false);
      }
    });

    

    

    return () => unsubscribe();
  }, [router]);


  // Samtang naga-check pa sa session sa Firebase, ipakita muna ang loading screen
  if (isCheckingSession) {
    return (
      <div className="h-[100dvh] w-full bg-[#0a0a0e] flex flex-col items-center justify-center text-white gap-3">
        <span className="loading loading-spinner loading-md text-pink-500"></span>
        <p className="text-xs text-white/50 tracking-wider uppercase">Checking session...</p>
      </div>
    );
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0e] flex items-center justify-center font-sans text-white px-4">
      
      {/* 1. BACKGROUND ANIMATION */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0e]/60 backdrop-blur-[80px] z-10" />
        <SoftAurora 
          color1="#f7f7f7" 
          color2="#e100ff" 
          speed={0.4} 
          brightness={1.2}
          noiseFrequency={2.5}
          bandSpread={1}
          colorSpeed={1}
          scale={1.5}
        />
      </div>

      {/* 2. THANK YOU CARD CONTENT */}
      <div className="relative z-20 max-w-sm sm:max-w-md w-full bg-black/30 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 text-center shadow-2xl flex flex-col items-center">
        
        {/* Icon / Avatar Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 text-white">
          Thank you for using <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            MON CHER
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 leading-relaxed">
          You have successfully logged out of your session. Safe travels through the digital walls!
        </p>

        {/* Created By Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md rounded-full shadow-lg mb-6 sm:mb-8">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Created by</span>
          <span className="text-xs text-white font-medium">Junwell</span>
        </div>

        {/* Return to Home / Login Button */}
        <a 
          href="/"
          className="btn bg-white text-black hover:bg-gray-200 border-none w-full rounded-2xl h-11 sm:h-12 font-semibold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center"
        >
          Return to Home
        </a>

      </div>
    </main>
  );
}