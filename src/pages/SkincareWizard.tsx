import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientAvatar } from "@/components/skincare/GradientAvatar";
import { BottomNav } from "@/components/skincare/BottomNav";
import { ProductCard } from "@/components/skincare/ProductCard";
import { ImagePreviewModal } from "@/components/skincare/ImagePreviewModal";
import { RoutineTable } from "@/components/skincare/RoutineTable";
import { Button } from "@/components/ui/button";
// Dialog, Input imports removed
import { ChevronDown, Camera, Mic, MicOff, X } from "lucide-react";
import { TypewriterText } from "@/components/skincare/TypewriterText";

import { useLiveApi } from "@/hooks/use-live-api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function SkincareWizard() {
  const [step, setStep] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const gender = (sessionStorage.getItem('wizard_gender') as 'male' | 'female') || 'female';

  const { isConnected, isSpeaking, connect, disconnect, sendMessage, sendImage, isLoading, setOnFunctionCall } = useLiveApi();

  const handleMicClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect(GEMINI_API_KEY, gender);
    }
  };

  const nextStep = () => {
    setStep(s => Math.min(s + 1, 9));
  };

  // Listen for function calls from Gemini (go_to_next_step)
  useEffect(() => {
    setOnFunctionCall((functionName: string, _args: any) => {
      if (functionName === 'go_to_next_step') {
        console.log('🔧 go_to_next_step called by Julia — advancing wizard!');
        nextStep();
      }
    });
  }, [setOnFunctionCall]);

  // Auto-connect on mount (with delay to let any previous session fully close)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        connect(GEMINI_API_KEY, gender);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sync AI with page changes (only for non-question steps that Julia doesn't control)
  useEffect(() => {
    if (!isConnected) return;

    // Only send prompts for steps that Julia doesn't navigate to via function calling
    let prompt = '';
    if (step === 1) {
      // Photo was just taken - tell Julia to start the Q&A
      prompt = gender === 'male'
        ? "المستخدم التقط صورته. حللي بشرته بناءً على الصورة، ثم اسأليه: بشرتك دهنية، جافة، مختلطة، ولا عادية؟ استني إجابته قبل ما تستدعي go_to_next_step."
        : "المستخدمة التقطت صورتها. حللي بشرتها بناءً على الصورة، ثم اسأليها: بشرتك دهنية، جافة، مختلطة، ولا عادية؟ استني إجابتها قبل ما تستدعي go_to_next_step.";
    } else if (step === 2) {
      prompt = gender === 'male'
        ? "ممتاز. الآن اسأليه حصرياً: ايه المشاكل اللي بتواجهك في بشرتك؟ واستني إجابته."
        : "ممتاز. الآن اسأليها حصرياً: ايه المشاكل اللي بتواجهك في بشرتك؟ واستني إجابتها.";
    } else if (step === 3) {
      prompt = gender === 'male'
        ? "عظيم. الآن اسأليه حصرياً: بتستخدم منتجات للعناية بالبشرة؟ واستني إجابته."
        : "عظيم. الآن اسأليها حصرياً: بتستخدمي منتجات للعناية بالبشرة؟ واستني إجابتها.";
    } else if (step === 4) {
      prompt = "جيد جداً. الآن اسأليه/اسأليها حصرياً: بشرتك حساسة؟ واستني الإجابة.";
    } else if (step === 5) {
      prompt = gender === 'male'
        ? "وأخيراً. اسأليه حصرياً: ايه النتيجة اللي عايز توصل لها؟ واستني إجابته."
        : "وأخيراً. اسأليها حصرياً: ايه النتيجة اللي عايزة توصلي لها؟ واستني إجابتها.";
    } else if (step === 6) {
      prompt = gender === 'male'
        ? "لقد وصلنا لصفحة المنتجات. قولي: دي المنتجات اللي اخترتها لك بعناية. (لا تستدعي go_to_next_step هنا)"
        : "لقد وصلنا لصفحة المنتجات. قولي: دي المنتجات اللي اخترتها لكِ بعناية. (لا تستدعي go_to_next_step هنا)";
    } else if (step === 7) {
      prompt = gender === 'male'
        ? "لقد وصلنا لصفحة الروتين. اشرحي له خطوات الاستخدام باختصار. (لا تستدعي go_to_next_step هنا)"
        : "لقد وصلنا لصفحة الروتين. اشرحي لها خطوات الاستخدام باختصار. (لا تستدعي go_to_next_step هنا)";
    }

    if (prompt) {
      setTimeout(() => {
        sendMessage(prompt);
      }, 1500);
    }
  }, [step, isConnected, sendMessage, gender]);

  // Handle the initial camera request once the wizard opens
  // Handle the initial camera request once the wizard opens
  let hasRequestedCamera = useRef(false);
  useEffect(() => {
    // Only speak the prompt once when SkincareWizard mounts, as it's unmounted until stage 3
    if (isConnected && step === 0 && !hasRequestedCamera.current) {
      hasRequestedCamera.current = true;
      setTimeout(() => {
        sendMessage(`قولي: ${gender === 'male' ? 'مستعد؟' : 'مستعدة؟'} عشان أقدر أساعدك، محتاجة أشوف بشرتك. ممكن ${gender === 'male' ? 'تفتح' : 'تفتحي'} الكاميرا عشان أقدر أحللها؟`);
      }, 500);
    }
  }, [isConnected, step, sendMessage, gender])

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64Image = dataUrl.split(",")[1];

        // Send image to Gemini (the step 1 prompt will tell Julia to analyze it)
        if (isConnected) {
          console.log("📸 Sending photo to Gemini for analysis...");
          sendImage(base64Image, "image/jpeg");
        }

        stopCamera();
        nextStep(); // Advances to step 1, which triggers the analysis prompt
        console.log("Photo captured. Connected:", isConnected);
      }
    }
  };

  useEffect(() => {
    // Cleanup camera on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Effect to trigger AI messages based on step
  useEffect(() => {
    if (!isConnected) return;

    // We can send hidden context to the model to guide the conversation
    if (step === 2) {
      sendMessage(gender === 'male' ? "لقد انتقلت للسؤال الثاني: ايه اكتر مشكلة بتواجهك؟ (تحدثي فوراً)" : "لقد انتقلت للسؤال الثاني: ايه اكتر مشكلة بتواجهيها؟ (تحدثي فوراً)");
    } else if (step === 3) {
      sendMessage(gender === 'male' ? "لقد انتقلت للسؤال الثالث: هل بشرتك حساسة؟ (تحدثي فوراً)" : "لقد انتقلت للسؤال الثالث: هل بشرتك حساسة؟ (تحدثي فوراً)");
    } else if (step === 4) {
      sendMessage(gender === 'male' ? "لقد انتقلت للسؤال الرابع: ايه الهدف اللي عايز توصله؟ (تحدثي فوراً)" : "لقد انتقلت للسؤال الرابع: ايه الهدف اللي عايزة توصليله؟ (تحدثي فوراً)");
    } else if (step === 6) {
      sendMessage(gender === 'male' ? "لقد وصلنا لصفحة المنتجات. قولى: دي المنتجات اللي اخترتها لك بعناية." : "لقد وصلنا لصفحة المنتجات. قولى: دي المنتجات اللي اخترتها لكِ بعناية.");
    } else if (step === 7) {
      sendMessage(gender === 'male' ? "لقد وصلنا لصفحة الروتين. اشرحي له خطوات الاستخدام باختصار." : "لقد وصلنا لصفحة الروتين. اشرحي لها خطوات الاستخدام باختصار.");
    } else if (step === 8) {
      sendMessage(gender === 'male' ? "لقد وصلنا لصفحة التأكيد (Confirmation). اسألي المستخدم الآن: 'إيه رأيك في الروتين ده؟ هل تحب نعتمد الروتين ولا محتاج نغير فيه حاجة؟'" : "لقد وصلنا لصفحة التأكيد (Confirmation). اسألي المستخدمة الآن: 'إيه رأيك في الروتين ده؟ هل تحبي نعتمد الروتين ولا محتاجة نغير فيه حاجة؟'");
    } else if (step === 9) {
      sendMessage("لقد وصلنا لصفحة الختام. قولي الرسالة الختامية المتفق عليها بخصوص رقم التليفون والـ QR code.");
    }
  }, [step, isConnected, sendMessage, gender]);

  // Mock Products
  const products = [
    {
      id: 1,
      name: "Eva Skin Clinic Anti-Ageing Gold",
      description: "Collagen Skin Rejuvenating Facial Serum 30 ml",
      price: "394.99 EGP",
      image: "/products/product1.jpg"
    },
    {
      id: 2,
      name: "Eva Skin Care Evasiline Body Lotion",
      description: "Passion 240 ml",
      price: "105.00 EGP",
      image: "/products/product2.jpg"
    },
    {
      id: 3,
      name: "Eva Skin Clinic Anti-Ageing Gold",
      description: "Collagen Skin Rejuvenating Facial Serum 30 ml",
      price: "44.99 EGP",
      image: "/products/product3.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32 overflow-hidden selection:bg-purple-100">
      <ImagePreviewModal
        isOpen={!!previewImage}
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
      <div className="max-w-4xl mx-auto px-6 py-12 h-full min-h-[80vh] flex flex-col items-center justify-center relative">


        {/* Main Content Area - Relative for absolute positioning of steps */}
        <div className="w-full h-full relative flex-1 flex flex-col items-center justify-center">
          <AnimatePresence>

            {/* STEP 0: INTRO */}
            {step === 0 && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col md:flex-row items-center justify-center gap-16 w-full"
              >
                <div className="shrink-0">
                  <GradientAvatar isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <div className="w-full max-w-sm h-[28rem] bg-gray-200 rounded-[2rem] flex flex-col items-center justify-center relative border-4 border-white shadow-xl overflow-hidden cursor-pointer group" onClick={startCamera}>
                  {!isCameraOpen ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                        <Camera size={80} strokeWidth={1} className="mb-8" />
                        <p className="text-sm font-medium">Click to open camera</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-black bg-white z-10 mt-auto mb-4 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                        onLoadedMetadata={() => videoRef.current?.play()}
                      />

                      <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <button
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
                      >
                        <div className="w-full h-full rounded-full border-2 border-transparent" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* QUESTIONS 1-5 SHARED LAYOUT */}
            {step >= 1 && step <= 5 && (
              <motion.div
                key="question-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col md:flex-row items-center justify-center gap-16 w-full"
              >
                <div className="shrink-0">
                  <GradientAvatar isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <div
                  className="w-full max-w-lg cursor-pointer text-center md:text-right"
                  onClick={nextStep}
                >
                  <motion.div
                    key={`q-text-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl md:text-5xl font-arabic font-bold text-gray-900 dir-rtl leading-tight">
                      {step === 1 && <TypewriterText text="ايه طبيعة بشرتك؟" />}
                      {step === 2 && <TypewriterText text={gender === 'male' ? "ايه المشاكل اللي بتواجهك في بشرتك؟" : "ايه المشاكل اللي بتواجهيها في بشرتك؟"} />}
                      {step === 3 && <TypewriterText text={gender === 'male' ? "بتستخدم منتجات للعناية بالبشرة؟" : "بتستخدمي منتجات للعناية بالبشرة؟"} />}
                      {step === 4 && <TypewriterText text="بشرتك حساسة؟" />}
                      {step === 5 && <TypewriterText text={gender === 'male' ? "ايه النتيجة اللي عايز توصل لها؟" : "ايه النتيجة اللي عايزة توصلي لها؟"} />}
                    </h2>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: PRODUCTS */}
            {step === 6 && (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full min-h-screen text-center flex flex-col items-center justify-center pb-24 pointer-events-none"
              >
                <div className="mb-0 pointer-events-auto mt-4 md:mt-8">
                  <GradientAvatar size="ml" className="mb-0" isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8 pointer-events-auto">
                  Skincare products you will use
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8 px-4 pb-4 w-full max-w-6xl mx-auto pointer-events-auto">
                  {products.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      {...p}
                      delay={i * 0.1}
                      onImageClick={() => setPreviewImage(p.image)}
                      onClick={nextStep}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 7: ROUTINE DETAIL */}
            {step === 7 && (
              <motion.div
                key="routine"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center pt-4 md:pt-8 pb-20"
                onClick={nextStep}
              >
                <div className="text-center mb-4 shrink-0 mt-4 md:mt-8">
                  <GradientAvatar size="ml" className="mb-0" isSpeaking={isSpeaking} isLoading={isLoading} />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 mt-2 px-4">Your skin routine</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start w-full px-4 max-w-6xl mx-auto">
                  <div className="md:col-span-7 bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-1/3 aspect-[3/4] md:aspect-[3/5] relative">
                      <img src={products[0].image} className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-left space-y-4">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 leading-tight">Eva Skin Clinic Anti-Ageing Gold</h4>
                        <p className="text-xs text-gray-500 mt-1">Collagen Skin Rejuvenating Facial Serum 30 ml</p>
                      </div>
                      <hr className="border-gray-50" />
                      <ul className="text-xs space-y-2 text-gray-700 leading-relaxed font-light">
                        <li>• <span className="font-bold">Clean First:</span> Wash your face and neck well before using the serum.</li>
                        <li>• <span className="font-bold">Day & Night:</span> Use it every morning and every night for the best results.</li>
                        <li>• <span className="font-bold">Massage:</span> Put 3-4 drops on your skin and rub gently in circles until it disappears.</li>
                        <li>• <span className="font-bold">Moisturize:</span> Wait a minute, then apply your face cream.</li>
                        <li>• <span className="font-bold">Safe Storage:</span> Keep the bottle in a cool place away from the sun.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="md:col-span-5 w-full">
                    <h3 className="text-xl md:text-2xl text-center font-light mb-4">What to Expect</h3>
                    <RoutineTable />
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-8 mb-4">
                  <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                </div>
              </motion.div>
            )}

            {/* STEP 8: CONFIRMATION */}
            {step === 8 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full text-center flex flex-col items-center md:justify-center overflow-y-auto pt-8 pb-24"
              >
                <div className="shrink-0 mt-4 md:mt-0">
                  <GradientAvatar size="ml" isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <div className="flex flex-col md:flex-row gap-6 mt-8 md:mt-12 w-full max-w-4xl justify-center items-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full md:w-96 h-48 md:h-64 rounded-[2.5rem] bg-[image:var(--gradient-brand)] shadow-xl flex items-center justify-center p-8 text-white text-2xl md:text-4xl font-normal tracking-wide relative overflow-hidden group"
                    onClick={nextStep}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="drop-shadow-md">Confirm my routine</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full md:w-80 h-48 md:h-64 rounded-[2.5rem] bg-[image:var(--gradient-glow)] shadow-xl flex items-center justify-center p-8 text-white text-2xl md:text-4xl font-normal tracking-wide leading-tight relative overflow-hidden group"
                    onClick={() => setStep(1)}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="drop-shadow-md">Need some changes?</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 9: SUBMIT */}
            {step === 9 && (
              <motion.div
                key="submit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full text-center flex flex-col items-center md:justify-center overflow-y-auto pt-8 pb-24"
              >
                <div className="shrink-0 mt-4 md:mt-0">
                  <GradientAvatar size="ml" isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <h2 className="text-3xl md:text-4xl font-light text-gray-900 my-8 max-w-2xl px-4 leading-tight">
                  Do you want to follow your skincare routine?
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mt-4 w-full justify-center px-4">
                  <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <div className="flex h-14 w-full md:w-80 rounded-xl border border-gray-800 overflow-hidden bg-transparent">
                      <div className="px-4 flex items-center justify-center border-r border-gray-800 text-gray-800 text-lg">
                        +20 <ChevronDown size={16} className="ml-1" />
                      </div>
                      <input
                        type="text"
                        placeholder="123456789"
                        className="flex-1 px-4 bg-transparent outline-none text-lg placeholder:text-gray-300 w-full"
                      />
                    </div>

                    <Button
                      className="w-48 h-14 text-2xl font-normal text-white rounded-xl bg-[image:var(--gradient-button)] hover:opacity-90 transition-opacity shadow-lg shadow-orange-100"
                    >
                      Submit
                    </Button>
                  </div>

                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-black p-4 rounded-lg">
                      <img
                        src="/custom-qr.png"
                        alt="Download App"
                        className="w-[150px] h-[150px] invert"
                      />
                      <div className="text-white text-center text-xs font-bold mt-2 tracking-widest">SCAN ME</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <BottomNav currentStep={step} totalSteps={10} />

        {/* Voice Interaction Control */}
        <div className="fixed top-6 right-6 z-50">
          <Button
            size="lg"
            className={`rounded-full w-14 h-14 shadow-xl transition-all duration-300 ${isConnected
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-white hover:bg-gray-100 text-purple-600"
              }`}
            onClick={handleMicClick}
          >
            {isConnected ? <Mic size={24} /> : <MicOff size={24} />}
          </Button>
        </div>

        {/* API Key Dialog Removed */}

      </div>
    </div>
  );
}
