import { motion } from "framer-motion";
import { GradientAvatar } from "@/components/skincare/GradientAvatar";
import { useEffect, useRef } from "react";
import { useLiveApi } from "@/hooks/use-live-api";

interface GenderSelectionProps {
    onNext?: () => void;
}

export default function GenderSelection({ onNext }: GenderSelectionProps) {
    const { isConnected, isSpeaking, isLoading, sendMessage, disconnect } = useLiveApi();
    const hasAsked = useRef(false);

    useEffect(() => {
        // the connected state can immediately be true if already connected from Welcome
        // however, we want to ensure it waits a tiny bit for the page transition.
        if (isConnected && !hasAsked.current) {
            hasAsked.current = true;
            // Add a small delay so it doesn't interrupt the welcome message if transitioning
            setTimeout(() => {
                sendMessage("قولي: عشان أقدر أكلمك صح، محتاجة أعرف حاجة بسيطة. إنت راجل ولا بنت؟ اختار أو اختاري Man أو Woman من الشاشة اللي قدامك.");
            }, 1000);
        }
    }, [isConnected, sendMessage]);

    const handleSelect = (gender: 'male' | 'female') => {
        sessionStorage.setItem('wizard_gender', gender);
        // Disconnect so the Wizard reconnects with the correct gender in the system prompt
        disconnect();
        if (onNext) onNext();
    };

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

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
                >
                    Tell us about yourself...
                </motion.h2>

                <div className="flex flex-col md:flex-row gap-6 mt-12 w-full justify-center items-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full md:w-64 h-48 rounded-[2.5rem] bg-[image:var(--gradient-button)] shadow-xl shadow-orange-100 flex items-center justify-center text-white text-3xl font-bold tracking-wide relative overflow-hidden group"
                        onClick={() => handleSelect('male')}
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <span className="drop-shadow-md">Man 👨</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full md:w-64 h-48 rounded-[2.5rem] bg-[image:var(--gradient-brand)] shadow-xl flex items-center justify-center text-white text-3xl font-bold tracking-wide relative overflow-hidden group"
                        onClick={() => handleSelect('female')}
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        <span className="drop-shadow-md">Woman 👩</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
