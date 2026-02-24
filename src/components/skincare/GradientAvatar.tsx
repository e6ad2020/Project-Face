import { motion } from "framer-motion";

export function GradientAvatar({ className = "", size = "lg", isSpeaking = false, isLoading = false }: { className?: string, size?: "sm" | "md" | "ml" | "lg" | "xl", isSpeaking?: boolean, isLoading?: boolean }) {
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

  const orbitRadius = {
    sm: 40,
    md: 80,
    ml: 100,
    lg: 130,
    xl: 170
  };

  const particleSize = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const radius = orbitRadius[size];
  const colors = ['#d946ef', '#a855f7', '#ec4899'];

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>

      {/* Orbiting particles - elegant thinking animation */}
      {isLoading && !isSpeaking && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute z-20 rounded-full"
              style={{
                width: particleSize,
                height: particleSize,
                background: `radial-gradient(circle, ${colors[i]}, transparent)`,
                boxShadow: `0 0 ${particleSize * 2}px ${colors[i]}`,
              }}
              animate={{
                x: Array.from({ length: 60 }, (_, k) =>
                  Math.cos((k / 60) * Math.PI * 2 + (i * Math.PI * 2) / 3) * radius
                ),
                y: Array.from({ length: 60 }, (_, k) =>
                  Math.sin((k / 60) * Math.PI * 2 + (i * Math.PI * 2) / 3) * radius
                ),
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                x: { duration: 3 + i * 0.5, repeat: Infinity, ease: "linear" },
                y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "linear" },
                opacity: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                scale: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              }}
            />
          ))}
        </>
      )}

      {/* Glow Layer */}
      <motion.div
        className={`absolute top-0 rounded-full bg-fuchsia-500/40 blur-3xl ${sizeClasses[size]}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isSpeaking ? [0.35, 0.85, 0.35] : isLoading ? [0.3, 0.6, 0.3] : 0.35,
          scale: isSpeaking ? [1.0, 1.5, 1.0] : isLoading ? [0.95, 1.15, 0.95] : 0.9,
        }}
        transition={{
          duration: isSpeaking ? 2.5 : isLoading ? 2 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Sphere Image */}
      <motion.img
        src="/ai-sphere.png"
        alt="AI Assistant"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: isSpeaking ? [0.97, 1.06, 0.97] : isLoading ? [0.97, 1.03, 0.97] : 1,
          opacity: 1,
          filter: isSpeaking
            ? [
              "drop-shadow(0px 0px 8px rgba(217, 70, 239, 0.3))",
              "drop-shadow(0px 0px 20px rgba(217, 70, 239, 0.6))",
              "drop-shadow(0px 0px 8px rgba(217, 70, 239, 0.3))"
            ]
            : isLoading
              ? "drop-shadow(0px 0px 12px rgba(168, 85, 247, 0.35))"
              : "drop-shadow(0px 10px 20px rgba(217, 70, 239, 0.3))"
        }}
        transition={{
          duration: isSpeaking ? 2.5 : isLoading ? 2 : 0.5,
          repeat: isSpeaking || isLoading ? Infinity : 0,
          ease: "easeInOut"
        }}
        className={`relative z-10 ${sizeClasses[size]} object-contain ${spacingClasses[size]}`}
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
