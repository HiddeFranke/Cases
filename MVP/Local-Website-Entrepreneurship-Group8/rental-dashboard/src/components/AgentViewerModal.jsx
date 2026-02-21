'use client';

import { useEffect, useRef, useState } from 'react';

export default function AgentViewerModal({ isOpen, onClose, jobName }) {
  const [screenshot, setScreenshot] = useState(null);
  const [active, setActive] = useState(true);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setScreenshot(null);
    setActive(true);

    // Initial fetch
    async function fetchScreenshot() {
      try {
        const res = await fetch('/api/agents/screenshot');
        const data = await res.json();

        if (!data.active) {
          setActive(false);
          return false;
        }

        if (data.screenshot) setScreenshot(data.screenshot);
        return true;
      } catch {
        return true;
      }
    }

    fetchScreenshot();

    // Poll every 400ms for smooth updates
    pollingRef.current = setInterval(async () => {
      const stillActive = await fetchScreenshot();
      if (!stillActive) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 400);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-lg font-semibold text-slate-800">
                Agent Viewer
              </h2>
            </div>
            {jobName && (
              <span className="text-sm text-slate-400 truncate max-w-[300px]">
                {jobName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600">
            Live weergave van de agent. Dit venster is alleen ter visualisatie — interactie is niet mogelijk.
          </p>
        </div>

        {/* Screenshot area */}
        <div className="px-6 py-4">
          <div
            className="relative bg-slate-100 rounded-lg overflow-hidden"
            style={{ aspectRatio: '1280 / 900' }}
          >
            {!screenshot && active && (
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-slate-600">Wachten op agent...</span>
              </div>
            )}

            {!active && !screenshot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">Agent is klaar</p>
                  <p className="text-xs text-slate-400 mt-1">De taak is afgerond</p>
                </div>
              </div>
            )}

            {screenshot && (
              <img
                src={`data:image/jpeg;base64,${screenshot}`}
                alt="Agent browser view"
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            )}

            {!active && screenshot && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg">
                  <p className="text-sm font-semibold text-slate-700">Agent is klaar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
