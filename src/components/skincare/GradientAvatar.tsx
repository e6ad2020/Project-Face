import { motion } from "framer-motion";

export function GradientAvatar({ className = "", size = "lg", isSpeaking = false }: { className?: string, size?: "sm" | "md" | "ml" | "lg" | "xl", isSpeaking?: boolean }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-28 h-28",
    ml: "w-36 h-36",
    lg: "w-48 h-48",
    xl: "w-64 h-64"
  };

  const spacingClasses = {
    sm: "mb-2",
    md: "mb-3",
    ml: "mb-1",
    lg: "mb-6",
    xl: "mb-8"
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Glow Layer */}
      <motion.div
        layoutId="ai-sphere-glow"
        className={`absolute top-0 rounded-full bg-fuchsia-500/40 blur-3xl ${sizeClasses[size]}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isSpeaking ? 0.8 : 0.35,
          scale: isSpeaking ? 1.4 : 0.9,
        }}
        transition={{
          duration: isSpeaking ? 1 : 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* Sphere Image */}
      <motion.img
        layoutId="ai-sphere-img"
        src="/ai-sphere.png"
        alt="AI Assistant"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: isSpeaking ? 1.05 : 1,
          opacity: 1,
          filter: isSpeaking
            ? "drop-shadow(0px 0px 15px rgba(217, 70, 239, 0.5))"
            : "drop-shadow(0px 10px 20px rgba(217, 70, 239, 0.3))"
        }}
        transition={{
          duration: 0.5,
          repeat: isSpeaking ? Infinity : 0,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className={`relative z-10 ${sizeClasses[size]} object-contain ${spacingClasses[size]}`}
      />
      <motion.h1
        layoutId="ai-sphere-text"
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
