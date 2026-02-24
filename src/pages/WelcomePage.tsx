import { motion } from "framer-motion";
import { GradientAvatar } from "@/components/skincare/GradientAvatar";
import { useEffect, useRef } from "react";
import { useLiveApi } from "@/hooks/use-live-api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface WelcomePageProps {
    onNext?: () => void;
}

export default function WelcomePage({ onNext }: WelcomePageProps) {
    const { isConnected, isSpeaking, isLoading, connect, sendMessage } = useLiveApi();

    useEffect(() => {
        // Connect to API on Welcome Page load
        if (!isConnected) {
            connect(GEMINI_API_KEY, 'female'); // Start with neutral/female default
        }
    }, [isConnected, connect]);

    const hasGreeted = useRef(false);

    useEffect(() => {
        // Send initial greeting once connected
        if (isConnected && !hasGreeted.current) {
            hasGreeted.current = true;
            setTimeout(() => {
                sendMessage("قولي بحماس: أهلاً بيكم في پروجكت فيس! أنا چوليا، مستشارة العناية بالبشرة. سواء كنت راجل أو بنت، أنا هنا عشان أساعدك تعتني ببشرتك. دوس أو دوسي على Get Started عشان نبدأ مع بعض!");
            }, 500);
        }
    }, [isConnected, sendMessage]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-center selection:bg-purple-100 p-6 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl flex flex-col items-center text-center space-y-12"
            >
                <div className="shrink-0 mb-8">
                    <GradientAvatar size="lg" isSpeaking={isSpeaking} isLoading={isLoading} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
                        Welcome to <span className="text-purple-600">Project Face</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500">
                        Your personal skincare expert is here to help
                    </p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full md:w-80 h-20 rounded-2xl bg-[image:var(--gradient-brand)] shadow-xl flex items-center justify-center text-white text-2xl font-bold tracking-wide relative overflow-hidden group mt-12"
                    onClick={() => onNext && onNext()}
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="drop-shadow-md">Get Started</span>
                </motion.button>
            </motion.div>
        </div>
    );
}
