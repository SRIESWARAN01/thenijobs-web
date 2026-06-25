'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Size map                                                           */
/* ------------------------------------------------------------------ */

const SIZE_MAP: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] md:max-w-5xl',
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  showClose = true,
  className = '',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                key="overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                key="content"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[calc(100%-1.5rem)] ${SIZE_MAP[size]}
                  rounded-2xl border border-white/[0.08]
                  bg-[rgba(15,15,30,0.95)] backdrop-blur-2xl
                  shadow-[0_24px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]
                  outline-none flex flex-col
                  max-h-[85vh]
                  ${size === 'full' ? 'md:max-h-[85vh] max-h-[calc(100vh-2rem)]' : ''}
                  ${className}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between px-4 pt-5 pb-4 shrink-0 sm:px-6 sm:pt-6">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-white font-[Outfit]">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-sm text-white/45 mt-1">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  {showClose && (
                    <Dialog.Close asChild>
                      <button
                        className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/30
                          hover:text-white/60 hover:bg-white/[0.06] transition-all"
                        aria-label="Close"
                      >
                        <X className="w-[18px] h-[18px]" />
                      </button>
                    </Dialog.Close>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0 sm:px-6">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-4 py-4 border-t border-white/[0.06] shrink-0 sm:px-6">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default Modal;
