'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'triangle';
}

interface ApplicationSuccessOverlayProps {
  show: boolean;
  applicantName: string;
  jobTitle: string;
  companyName: string;
  isWalkIn?: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  '#10b981', '#34d399', '#6ee7b7',  // emerald
  '#7c3aed', '#a78bfa', '#c4b5fd',  // violet
  '#06b6d4', '#22d3ee', '#67e8f9',  // cyan
  '#f59e0b', '#fbbf24', '#fcd34d',  // amber
  '#f43f5e', '#fb7185',              // rose
];

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 720 - 360,
    scale: 0.4 + Math.random() * 0.8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2,
    shape: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
  }));
}

function ConfettiPiece({ particle }: { particle: ConfettiParticle }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
      }}
      initial={{ y: 0, opacity: 1, rotate: 0, scale: 0 }}
      animate={{
        y: [0, window.innerHeight * 1.2],
        opacity: [1, 1, 0.8, 0],
        rotate: particle.rotation,
        scale: [0, particle.scale, particle.scale, particle.scale * 0.5],
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {particle.shape === 'circle' && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      )}
      {particle.shape === 'square' && (
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      )}
      {particle.shape === 'triangle' && (
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: `10px solid ${particle.color}`,
          }}
        />
      )}
    </motion.div>
  );
}

export default function ApplicationSuccessOverlay({
  show,
  applicantName,
  jobTitle,
  companyName,
  isWalkIn = false,
  onClose,
}: ApplicationSuccessOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (show) {
      setConfetti(generateConfetti(60));
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
    }
  }, [show, onClose]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#0a0a1a]/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti Layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((p) => (
              <ConfettiPiece key={p.id} particle={p} />
            ))}
          </div>

          {/* Success Card */}
          <motion.div
            className="relative z-10 max-w-md w-[90%] mx-auto"
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              delay: 0.15,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring behind card */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-violet-500/20 blur-xl" />

            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 text-center backdrop-blur-2xl shadow-2xl">
              {/* Animated Checkmark */}
              <motion.div
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  stiffness: 200,
                  delay: 0.3,
                }}
              >
                <motion.svg
                  className="h-10 w-10 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              {/* Radiating Pulse Rings */}
              <div className="absolute top-[76px] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute -inset-4 rounded-full border border-emerald-400/30"
                    initial={{ scale: 0.5, opacity: 0.6 }}
                    animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5 + i * 0.3,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              {/* Title */}
              <motion.h2
                className="text-xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {isWalkIn ? 'Walk-In Application Submitted!' : 'Application Submitted!'}
              </motion.h2>

              <motion.p
                className="text-sm text-emerald-400 font-semibold mb-5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Congratulations {applicantName}! 🎉
              </motion.p>

              {/* Job Details Card */}
              <motion.div
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 mb-5 text-left space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-xs text-gray-400">
                  You have successfully applied for
                </p>
                <p className="text-base font-bold text-white leading-snug">
                  &ldquo;{jobTitle}&rdquo;
                </p>
                <p className="text-xs text-violet-400 font-medium">
                  at {companyName}
                </p>
                <div className="flex items-center gap-4 pt-2 border-t border-white/[0.06]">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date</p>
                    <p className="text-xs font-semibold text-gray-300">{dateStr}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Time</p>
                    <p className="text-xs font-semibold text-gray-300">{timeStr}</p>
                  </div>
                </div>
              </motion.div>

              {/* Status */}
              <motion.div
                className="flex items-center justify-center gap-2 text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Status: Applied
              </motion.div>

              {/* Dismiss hint */}
              <motion.p
                className="text-[10px] text-gray-600 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Tap anywhere to close
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
