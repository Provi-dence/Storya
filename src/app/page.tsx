"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SoftAurora from "@/components/SoftAurora";
import BorderGlow from "@/components/BorderGlow";

export default function Home() {
  const router = useRouter();
  
  // States para sa flow
  const [isLoading, setIsLoading] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // State para sa Modal Steps: 'email' o kaya 'code'
  const [modalStep, setModalStep] = useState<'email' | 'code'>('email');

  // Step 1: I-send ang email para ma-trigger ang code
  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      // Human og enter sa email, balhin sa code verification step
      setModalStep('code');
    }, 1200);
  };

  // Step 2: I-verify ang gi-enter nga code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      // I-close ang modal
      const modal = document.getElementById('login_modal') as HTMLDialogElement;
      modal?.close();

      // Redirect sa chat page
      router.push('/home');
    }, 1200);
  };

  // Reset modal state kung i-close
  const resetModal = () => {
    setModalStep('email');
    setSenderEmail("");
    setVerificationCode("");
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0e] flex items-center justify-center font-sans">
      
      {/* 1. BACKGROUND ANIMATION */}
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

      {/* 2. FOREGROUND CONTENT */}
      <div className="hero relative z-10 w-full px-4 sm:px-6 md:px-8 py-10">
        <div className="hero-content text-center w-full max-w-5xl mx-auto">
          <div className="max-w-4xl flex flex-col items-center w-full">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-1.5 py-1.5 pr-4 border border-white/10 bg-white/5 backdrop-blur-md mb-6 sm:mb-8 shadow-xl rounded-full">
              <span className="bg-white text-black font-bold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Created by
              </span>
              <span className="text-xs sm:text-sm text-white/90 font-medium pr-1">
                Junwell
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-extrabold sm:mb-6 text-white tracking-tight leading-[1.1]">
              STORYA TA
            </h1>
            
            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl font-medium text-white/80 mb-10 sm:mb-12 max-w-sm sm:max-w-md md:max-w-xl mx-auto leading-relaxed">
              Bridging the distance, right through the office walls. <br />
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-[18rem] sm:max-w-none mx-auto">
              <div className="w-full sm:w-[280px] md:w-[300px]">
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

      {/* ================= AUTHENTICATION MODAL ================= */}
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md bg-black/40" onClose={resetModal}>
        <div className="modal-box bg-[#120F17] border border-white/10 border-b-0 sm:border-b-white/10 text-white shadow-2xl rounded-t-[2rem] rounded-b-none sm:rounded-3xl p-6 sm:p-8">
          
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>

          {modalStep === 'email' ? (
            /* ================= STEP 1: ENTER EMAIL ================= */
            <div>
              <h3 className="font-bold text-2xl mb-2 text-center text-white">Welcome Back</h3>
              <p className="text-white/60 text-sm text-center mb-6">
                Enter your email address to receive a secure login code.
              </p>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-white/70 font-semibold px-1">
                    Your Email (Sender)
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. junwell@email.com" 
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
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
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= STEP 2: ENTER CODE ================= */
            <div>
              <h3 className="font-bold text-2xl mb-2 text-center text-white">Check Your Email</h3>
              <p className="text-white/60 text-sm text-center mb-6">
                We've sent a verification code to <span className="text-white font-medium">{senderEmail}</span>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-white/70 font-semibold px-1">
                    Verification Code
                  </label>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input input-bordered w-full bg-black/50 border-white/10 text-white placeholder-white/30 text-center tracking-widest text-lg focus:outline-none focus:border-pink-500 rounded-xl h-12"
                  />
                </div>

                <div className="modal-action mt-6 flex flex-col gap-2">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none text-white w-full rounded-xl h-12 font-semibold text-base shadow-lg disabled:opacity-80"
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm text-white"></span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      "Verify & Log in"
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setModalStep('email')}
                    className="btn btn-ghost btn-sm text-white/50 hover:text-white mt-2"
                  >
                    ← Back to email input
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Close button */}
          <form method="dialog">
            <button onClick={resetModal} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-white/70 hover:text-white hidden sm:flex">
              ✕
            </button>
          </form>

        </div>
        
        <form method="dialog" className="modal-backdrop">
          <button onClick={resetModal}>close</button>
        </form>
      </dialog>
    
    </main>
  );
}