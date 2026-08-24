/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { mobilePerfProfiler, InteractionMetric } from '../../utils/mobilePerfProfiler';
import { Activity, X, Trash2, CheckCircle, PlusCircle, MinusCircle } from 'lucide-react';

export const MobilePerfHUD: React.FC = () => {
  const [metrics, setMetrics] = useState<InteractionMetric[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(mobilePerfProfiler.getIsEnabled());

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(mobilePerfProfiler.getMetrics());
    };

    const interval = setInterval(updateMetrics, 200);
    return () => clearInterval(interval);
  }, []);

  if (!isEnabled && !isOpen) {
    // Small subtle trigger in bottom-left corner for developer invocation
    return (
      <button
        onClick={() => {
          mobilePerfProfiler.setEnabled(true);
          setIsEnabled(true);
          setIsOpen(true);
        }}
        className="fixed bottom-2 left-2 z-50 p-1.5 rounded-lg bg-black/40 text-white/70 hover:text-white text-[10px] font-mono backdrop-blur-xs flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"
        title="Open Mobile Performance Diagnostics"
      >
        <Activity className="w-3 h-3" />
        <span>FPS/Perf</span>
      </button>
    );
  }

  const latest = metrics[0];

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:right-auto sm:w-96 z-50 bg-[#121212]/95 text-white/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-white tracking-wide">Mobile Diagnostics HUD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              mobilePerfProfiler.clearMetrics();
              setMetrics([]);
            }}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
            title="Clear metrics"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              mobilePerfProfiler.setEnabled(false);
              setIsEnabled(false);
              setIsOpen(false);
            }}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Latest interaction summary */}
      {latest ? (
        <div className="bg-white/5 rounded-xl p-2.5 mb-2 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-white/60 mb-1">
            <span className="flex items-center gap-1 uppercase font-semibold text-white/80">
              {latest.type === 'checkbox' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              {latest.type === 'plus' && <PlusCircle className="w-3.5 h-3.5 text-blue-400" />}
              {latest.type === 'minus' && <MinusCircle className="w-3.5 h-3.5 text-amber-400" />}
              {latest.type}
            </span>
            <span>{latest.timestamp}</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs text-white/70">Touch → Paint:</span>
            <span
              className={`text-base font-bold tabular-nums ${
                latest.totalTouchToPaintMs < 20
                  ? 'text-emerald-400'
                  : latest.totalTouchToPaintMs < 40
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {latest.totalTouchToPaintMs} ms
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-white/5 text-[10px] text-white/60">
            <div>
              Handler Exec: <span className="text-white font-semibold">{latest.handlerDurationMs}ms</span>
            </div>
            <div>
              Render → Paint: <span className="text-white font-semibold">{latest.renderToPaintMs}ms</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-white/40 text-[11px]">
          Tap a Checkbox, (+) or (-) button to profile response latency.
        </div>
      )}

      {/* History log */}
      {metrics.length > 1 && (
        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
          <div className="text-[10px] text-white/40 uppercase font-semibold tracking-wider px-1">
            Recent Taps
          </div>
          {metrics.slice(1, 6).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-lg text-[11px]"
            >
              <span className="capitalize text-white/70">{m.type}</span>
              <span
                className={`font-semibold tabular-nums ${
                  m.totalTouchToPaintMs < 20 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {m.totalTouchToPaintMs}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
