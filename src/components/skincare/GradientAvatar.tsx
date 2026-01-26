import { motion } from "framer-motion";

export function GradientAvatar({ className = "", size = "lg", isSpeaking = false }: { className?: string, size?: "sm" | "md" | "lg" | "xl", isSpeaking?: boolean }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-48 h-48",
    xl: "w-64 h-64"
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ 
          scale: isSpeaking ? [1, 1.1, 1] : 1,
          opacity: 1,
          boxShadow: isSpeaking 
            ? "0 0 40px 10px rgba(217, 70, 239, 0.6)" 
            : "0 25px 50px -12px rgba(217, 70, 239, 0.25)"
        }}
        transition={{ 
          duration: isSpeaking ? 1.5 : 0.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut"
        }}
        className={`${sizeClasses[size]} rounded-full bg-[image:var(--gradient-brand)] mb-6`}
      />
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-normal tracking-tight text-foreground"
      >
        Julia
      </motion.h1>
    </div>
  );
}
