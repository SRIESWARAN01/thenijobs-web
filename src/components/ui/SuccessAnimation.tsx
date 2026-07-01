'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, MessageCircle, Send, Star, X } from 'lucide-react';

interface SuccessAnimationProps {
  variant: 'review' | 'apply' | 'whatsapp' | 'enquiry';
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  autoCloseDuration?: number; // ms, default 3000
}

const VARIANTS = {
  review: {
    icon: Star,
    title: 'Review Submitted!',
    subtitle: 'Thank you for sharing your feedback.',
    iconBg: 'from-amber-500 to-orange-500',
    iconColor: 'text-white',
    confettiColors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'],
  },
  apply: {
    icon: Check,
    title: 'Application Sent!',
    subtitle: 'The employer will review your profile.',
    iconBg: 'from-emerald-500 to-teal-500',
    iconColor: 'text-white',
    confettiColors: ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'],
  },
  whatsapp: {
    icon: MessageCircle,
    title: 'WhatsApp Opened!',
    subtitle: 'Your enquiry message is ready to send.',
    iconBg: 'from-green-500 to-emerald-600',
    iconColor: 'text-white',
    confettiColors: ['#22c55e', '#16a34a', '#10b981', '#a3e635', '#fbbf24'],
  },
  enquiry: {
    icon: Send,
    title: 'Enquiry Submitted!',
    subtitle: 'The business will respond shortly.',
    iconBg: 'from-blue-500 to-indigo-600',
    iconColor: 'text-white',
    confettiColors: ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'circle' | 'square' | 'star';
}

export default function SuccessAnimation({
  variant,
  title,
  subtitle,
  onClose,
  autoCloseDuration = 3500,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const config = VARIANTS[variant];
  const Icon = config.icon;

  const generateParticles = useCallback(() => {
    const shapes: Particle['shape'][] = ['circle', 'square', 'star'];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 45,
      color: config.confettiColors[Math.floor(Math.random() * config.confettiColors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 14,
      velocityY: -(Math.random() * 12 + 4),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [config.confettiColors]);

  useEffect(() => {
    setParticles(generateParticles());

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, onClose, generateParticles]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto animate-fadeIn"
        onClick={() => { setVisible(false); onClose?.(); }}
      />

      {/* Confetti Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-confetti"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
              transform: `rotate(${p.rotation}deg)`,
              '--vx': `${p.velocityX}vw`,
              '--vy': `${p.velocityY}vh`,
              boxShadow: p.shape !== 'star' ? `0 0 6px ${p.color}44` : 'none',
              ...(p.shape === 'star' ? {
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                backgroundColor: p.color,
              } : {}),
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Success Card */}
      <div className="relative pointer-events-auto animate-successPop z-10">
        <div className="bg-[#0d0d20]/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl p-8 shadow-2xl text-center max-w-xs mx-4 space-y-4">
          {/* Close button */}
          <button
            onClick={() => { setVisible(false); onClose?.(); }}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>

          {/* Animated Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center mx-auto shadow-lg animate-bounce-slow`}>
            <Icon size={28} className={config.iconColor} />
          </div>

          {/* Text */}
          <h3 className="text-lg font-black font-outfit text-white">
            {title || config.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {subtitle || config.subtitle}
          </p>

          {/* Progress bar auto-close */}
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{
                animation: `shrinkWidth ${autoCloseDuration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), calc(var(--vy) + 60vh)) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes successPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-confetti {
          animation: confetti 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-successPop {
          animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        .animate-bounce-slow {
          animation: bounce 1.5s ease-in-out 0.5s 1;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
