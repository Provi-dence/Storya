"use client";

import SoftAurora from "@/components/SoftAurora";

export default function LogoutPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0e] flex items-center justify-center font-sans text-white px-4">
      
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
      <div className="relative z-20 max-w-md w-full bg-black/30 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 text-center shadow-2xl flex flex-col items-center">
        
        {/* Icon / Avatar Badge */}
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-white">
          Thank you for using <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            MON CHER
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          You have successfully logged out of your session. Safe travels through the digital walls!
        </p>

        {/* Created By Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md rounded-full shadow-lg mb-8">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Created by</span>
          <span className="text-xs text-white font-medium">Junwell</span>
        </div>

        {/* Return to Home / Login Button */}
        <a 
          href="/"
          className="btn bg-white text-black hover:bg-gray-200 border-none w-full rounded-2xl h-12 font-semibold text-sm shadow-lg transition-all"
        >
          Return to Home
        </a>

      </div>
    </main>
  );
}