"use client"; 

import { useState } from "react";
import { motion } from "framer-motion";
import SoftAurora from "@/components/SoftAurora";
import BorderGlow from "@/components/BorderGlow";
import WarpText from '@/components/WarpText';

export default function Home() {
  // Setup sa state para sa form ug loading
  const [isLoading, setIsLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Function nga mo-trigger inig submit sa email sulod sa modal
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    
    setIsLoading(true);
    
    // Simulate ta ug 1.5 seconds nga loading usa mobalik
    setTimeout(() => {
      setIsLoading(false);
      // Dinhi nimo i-redirect padulong sa actual chat page puhon
      alert(`Connected with ${recipientEmail}! Ready for chat.`);
    }, 1500);
  };

  return (
    // overflow-x-hidden prevents horizontal scrolling bugs on mobile but allows vertical scrolling if needed
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0e] flex items-center justify-center font-sans">
      
      {/* 1. ANG BACKGROUND ANIMATION (Naa sa luyo) */}
      <div className="absolute inset-0 z-0">
        <SoftAurora 
          color1="#f7f7f7" 
          color2="#e100ff" 
          speed={0.6} 
          brightness={1.2}
          noiseFrequency={2.5}
          bandSpread={1}
          colorSpeed={1}
          mouseInfluence={0.25}
          enableMouseInteraction={true}
          scale={1.5}
        />
      </div>

      {/* 2. FOREGROUND CONTENT (Daisy UI Layout) */}
      <div className="hero relative z-10 w-full px-4 sm:px-6 md:px-8 py-10">
        <div className="hero-content text-center w-full max-w-5xl mx-auto">
          <div className="max-w-4xl flex flex-col items-center w-full">
            
            {/* Top Pill Badge (Responsive gap and padding) */}
            <div className="inline-flex items-center gap-2.5 px-1.5 py-1.5 pr-4 border border-white/10 bg-white/5 backdrop-blur-md mb-6 sm:mb-8 shadow-xl rounded-full">
              <span className="bg-white text-black font-bold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Created by
              </span>
              <span className="text-xs sm:text-sm text-white/90 font-medium pr-1">
                Junwell
              </span>
            </div>

            {/* Main Heading - Fluid sizing from mobile to PC */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-extrabold sm:mb-6 text-white tracking-tight leading-[1.1]">
              STORYA TA
            </h1>
            
            {/* Subheading - Fixed invalid 'text-med' class to 'text-lg/xl' */}
            <p className="text-base sm:text-lg md:text-xl font-medium text-white/80 mb-10 sm:mb-12 max-w-sm sm:max-w-md md:max-w-xl mx-auto leading-relaxed">
              Bridging the distance, right through the office walls. <br />
            </p>
            
            {/* Action Buttons - Responsive stacking and sizing */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-[18rem] sm:max-w-none mx-auto">
              
              <div className="w-full sm:w-[280px] md:w-[300px]">
                {/* Framer Motion wrapper para sa spring animation */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor="40 80 80"
                    backgroundColor="#120F17" 
                    borderRadius={16} 
                    glowRadius={60}
                    glowIntensity={1}
                    coneSpread={40}
                    animated={true}
                    colors={['#c084fc', '#f472b6', '#38bdf8']} 
                  >
                    {/* Gi-ilis ang onClick para mo-abli sa Daisy UI modal */}
                    <button 
                      onClick={() => (document.getElementById('login_modal') as HTMLDialogElement)?.showModal()}
                      className="w-full min-h-[3.5rem] md:min-h-[4rem] flex items-center justify-center gap-2 text-white/90 hover:text-white font-semibold text-sm md:text-base bg-transparent border-none outline-none transition-all duration-200 cursor-pointer rounded-2xl"
                    >
                      Log in
                    </button>
                  </BorderGlow>
                </motion.div>
              </div>
              
            </div>

          </div>
        </div>
      </div>

      {/* ================= DAISY UI EMAIL LOGIN MODAL ================= */}
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md bg-black/40">
        {/* GI-FIX NGA MODAL-BOX: Flat sa ubos sa mobile, rounded inig PC */}
        <div className="modal-box bg-[#120F17] border border-white/10 border-b-0 sm:border-b-white/10 text-white shadow-2xl rounded-t-[2rem] rounded-b-none sm:rounded-3xl p-6 sm:p-8">
          
          {/* Aesthetic Drag Handle para sa mobile ra makita (Optional but nice) */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>

          <h3 className="font-bold text-2xl mb-2 text-center text-white">Welcome</h3>
          <p className="text-white/60 text-sm text-center mb-6">
            Enter the your email address as a recipient to start chatting. No password required.
          </p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="label text-xs uppercase tracking-wider text-white/70 font-semibold px-1">
                Recipient Email
              </label>
              <input 
                type="email" 
                required
                placeholder="e.g. angely@email.com" 
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="input input-bordered w-full bg-black/50 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-pink-500 rounded-xl h-12"
              />
            </div>

            <div className="modal-action mt-6 flex gap-3">
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none text-white w-full rounded-xl h-12 font-semibold text-base shadow-lg disabled:opacity-80"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm text-white"></span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  "Start Chatting"
                )}
              </button>
            </div>
          </form>

          {/* Close button sa upper right sa modal (gitago sa mobile para limpyo, mo-click ra silag gawas) */}
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-white/70 hover:text-white hidden sm:flex">
              ✕
            </button>
          </form>

        </div>
        
        {/* Click outside to close backdrop */}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    
    </main>
  );
}