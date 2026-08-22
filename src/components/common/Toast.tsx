/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: { text: string; type?: 'success' | 'info' | 'error' } | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 max-w-sm w-full pointer-events-auto"
        >
          <div
            id="app-toast-alert"
            className="flex items-center gap-3 px-4 py-3 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-xl shadow-xl backdrop-blur-sm border border-slate-700/50"
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : message.type === 'info' ? (
              <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="text-sm font-medium flex-1 line-clamp-2">{message.text}</p>
            {onClose && (
              <button
                id="toast-close-btn"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
