"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SoftAurora from "@/components/SoftAurora";
import BorderGlow from "@/components/BorderGlow";

// I-IMPORT ANG FIREBASE AUTH FUNCTIONS
import { auth } from "@/lib/firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  
  // States para sa flow
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [senderEmail, setSenderEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // State para ma-store ang tinuod nga nag-usab-usab nga OTP
  const [generatedOTP, setGeneratedOTP] = useState("");
  
  // State para sa Modal Steps: 'email' o kaya 'code'
  const [modalStep, setModalStep] = useState<'email' | 'code'>('email');

  // State para sa Glowing Toast Notification (ReactBits Style)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showCustomToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // =========================================================================
  // AUTO-REDIRECT KUNG NAKA-LOG IN NA DAAN ANG USER
  // =========================================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/home');
      } else {
        setIsCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Step 1: I-generate ang dynamic OTP ug i-send sa Backend (Nodemailer)
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderEmail) return;

    setIsLoading(true);

    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOTP);

    try {
      console.log("📨 Calling /api/send-email...");

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: senderEmail,
          code: newOTP,
        }),
      });

      const data = await response.json();

      console.log("📩 API Response:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error || "Failed to send verification email"
        );
      }

      setModalStep("code");

      showCustomToast(
        "Secure login code sent to your email!",
        "success"
      );

    } catch (error: any) {
      console.error("❌ Send Email Error:", error);

      showCustomToast(
        error?.message || "Something went wrong!",
        "error"
      );

    } finally {
      setIsLoading(false);
    }
  };


  // Step 2: I-verify ang OTP usa pa isulod sa Firebase
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length < 6) return;
    
    if (verificationCode !== generatedOTP) {
      showCustomToast("Sayop ang OTP nga imong gi-enter. Palihug sulayi usab.", "error");
      return;
    }

    setIsLoading(true);
    const dummyPassword = `${senderEmail}-MonCherSecretAuth2026!`;

    try {
      await signInWithEmailAndPassword(auth, senderEmail, dummyPassword);
      
      showCustomToast("Successfully logged in! Redirecting...", "success");
      
      setTimeout(() => {
        setIsLoading(false);
        const modal = document.getElementById('login_modal') as HTMLDialogElement;
        modal?.close();
        router.push('/home');
      }, 1000);

    } catch (error: any) {
      try {
        await createUserWithEmailAndPassword(auth, senderEmail, dummyPassword);
        
        showCustomToast("Account created & successfully logged in!", "success");
        
        setTimeout(() => {
          setIsLoading(false);
          const modal = document.getElementById('login_modal') as HTMLDialogElement;
          modal?.close();
          router.push('/home');
        }, 1000);

      } catch (createError: any) {
        setIsLoading(false);
        console.error("Firebase Auth Error:", createError.message);
        showCustomToast("Nag-error ang Firebase. Palihug sulayi usab.", "error");
      }
    }
  };

  // Samtang naga-check pa sa session sa Firebase, ipakita muna ang loading screen
  if (isCheckingSession) {
    return (
      <div className="h-[100dvh] w-full bg-[#0a0a0e] flex flex-col items-center justify-center text-white gap-3">
        <span className="loading loading-spinner loading-md text-pink-500"></span>
        <p className="text-xs text-white/50 tracking-wider uppercase">Checking session...</p>
      </div>
    );
  }

  // Reset modal state kung i-close
  const resetModal = () => {
    setModalStep('email');
    setSenderEmail("");
    setVerificationCode("");
    setGeneratedOTP("");
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0e] flex items-center justify-center font-sans">
      
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
      <div className="hero relative z-10 w-full px-4 sm:px-6 md:px-8 py-6">
        <div className="hero-content text-center w-full max-w-5xl mx-auto">
          <div className="max-w-4xl flex flex-col items-center w-full">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-1.5 py-1.5 pr-4 border border-white/10 bg-white/5 backdrop-blur-md mb-4 sm:mb-6 shadow-xl rounded-full">
              <span className="bg-white text-black font-bold text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                Created by
              </span>
              <span className="text-xs sm:text-sm text-white/90 font-medium pr-1">
                Junwell
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold mb-3 sm:mb-4 text-white tracking-tight leading-[1.1]">
              MON CHER
            </h1>
            
            {/* Subheading */}
            <p className="text-sm sm:text-lg md:text-xl font-medium text-white/80 mb-8 sm:mb-10 max-w-xs sm:max-w-md md:max-w-xl mx-auto leading-relaxed">
              Bridging the distance, right through the office walls.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-[16rem] sm:max-w-none mx-auto">
              <div className="w-full sm:w-[260px] md:w-[280px]">
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
                      className="w-full min-h-[3.2rem] md:min-h-[3.8rem] flex items-center justify-center gap-2 text-white/90 hover:text-white font-semibold text-sm md:text-base bg-transparent border-none outline-none transition-all duration-200 cursor-pointer rounded-2xl"
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
      <dialog id="login_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md bg-black/40 " onClose={resetModal}>

        {/* ================= GLOWING TOAST NOTIFICATION (REACTBITS STYLE - TOP LAYER Z-50) ================= */}
        
        <div className="fixed top-6 z-[9999] px-4 w-full max-w-md pointer-events-none flex justify-center">
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="pointer-events-auto w-full shadow-2xl"
              >
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor={toast.type === 'success' ? "80 200 120" : "220 60 80"}
                  backgroundColor="#120F17" 
                  borderRadius={16} 
                  glowRadius={50}
                  glowIntensity={1.2}
                  coneSpread={40}
                  animated={true}
                  colors={toast.type === 'success' ? ['#4ade80', '#38bdf8', '#c084fc'] : ['#f87171', '#fb923c', '#f472b6']}
                >
                  <div className="px-5 py-3.5 flex items-center gap-3 w-full bg-[#120F17]/90 backdrop-blur-xl rounded-2xl">
                    <span className="text-lg">
                      {toast.type === 'success' ? '✨' : '⚠️'}
                    </span>
                    <p className="text-sm font-medium text-white/90">
                      {toast.message}
                    </p>
                  </div>
                </BorderGlow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                    className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none text-white w-full rounded-xl h-12 font-semibold text-base shadow-lg disabled:opacity-80 cursor-pointer"
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
                    className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none text-white w-full rounded-xl h-12 font-semibold text-base shadow-lg disabled:opacity-80 cursor-pointer"
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
                    className="btn btn-ghost btn-sm text-white/50 hover:text-white mt-2 cursor-pointer"
                  >
                    ← Back to email input
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Close button */}
          <form method="dialog">
            <button onClick={resetModal} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-white/70 hover:text-white hidden sm:flex cursor-pointer">
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