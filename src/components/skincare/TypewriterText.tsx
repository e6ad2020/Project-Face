import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface TypewriterTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export function TypewriterText({ text, className = "", delay = 0 }: TypewriterTextProps) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const displayText = useTransform(rounded, (latest) => text.slice(0, latest));

    useEffect(() => {
        const controls = animate(count, text.length, {
            type: "tween",
            duration: text.length * 0.05, // Adjust typing speed here
            ease: "linear",
            delay: delay,
        });
        return controls.stop;
    }, [text, delay]);

    return <motion.span className={className}>{displayText}</motion.span>;
}
