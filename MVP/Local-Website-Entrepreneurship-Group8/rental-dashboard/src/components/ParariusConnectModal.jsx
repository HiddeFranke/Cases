'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function ParariusConnectModal({ isOpen, onClose, onConnected }) {
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const pollingRef = useRef(null);
  const imgRef = useRef(null);
  const modalRef = useRef(null);

  // Start the browser session when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function start() {
      setStarting(true);
      setError(null);
      setScreenshot(null);
      try {
        const res = await fetch('/api/pararius/connect', { method: 'POST' });
        const data = await res.json();
        if (cancelled) return;

        if (data.error) {
          setError(data.error);
          setStarting(false);
          return;
        }

        setScreenshot(data.screenshot);
        setSessionActive(true);
        setStarting(false);

        if (data.loginDetected) {
          onConnected?.();
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStarting(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Screenshot polling (500ms interval)
  useEffect(() => {
    if (!sessionActive || !isOpen) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/pararius/screenshot');
        const data = await res.json();

        if (!data.active) {
          setSessionActive(false);
          clearInterval(pollingRef.current);
          return;
        }

        if (data.screenshot) setScreenshot(data.screenshot);

        if (data.loginDetected) {
          setSessionActive(false);
          clearInterval(pollingRef.current);
          onConnected?.();
        }
      } catch {
        /* ignore polling errors */
      }
    }, 500);

    return () => clearInterval(pollingRef.current);
  }, [sessionActive, isOpen]);

  // Keyboard capture while modal is open and session is active
  useEffect(() => {
    if (!isOpen || !sessionActive) return;

    async function handleKeyDown(e) {
      if (e.key === 'Escape') return;

      e.preventDefault();
      e.stopPropagation();

      setLoading(true);

      const action =
        e.key.length === 1
          ? { type: 'type', text: e.key }
          : { type: 'press', key: e.key };

      try {
        const res = await fetch('/api/pararius/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        const data = await res.json();

        if (data.screenshot) setScreenshot(data.screenshot);
        if (data.loginDetected && data.saved) {
          setSessionActive(false);
          onConnected?.();
        }
      } catch {
        /* ignore */
      }

      setLoading(false);
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, sessionActive]);

  // Click handler on the screenshot image
  const handleScreenshotClick = useCallback(
    async (e) => {
      if (!sessionActive || loading || !imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();
      const scaleX = 900 / rect.width;
      const scaleY = 650 / rect.height;
      const x = Math.round((e.clientX - rect.left) * scaleX);
      const y = Math.round((e.clientY - rect.top) * scaleY);

      setLoading(true);

      try {
        const res = await fetch('/api/pararius/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'click', x, y }),
        });
        const data = await res.json();

        if (data.screenshot) setScreenshot(data.screenshot);
        if (data.loginDetected && data.saved) {
          setSessionActive(false);
          onConnected?.();
        }
      } catch {
        /* ignore */
      }

      setLoading(false);
    },
    [sessionActive, loading]
  );

  // Cancel / close
  async function handleCancel() {
    clearInterval(pollingRef.current);
    setSessionActive(false);
    try {
      await fetch('/api/pararius/connect', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Verbind met Pararius
          </h2>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-700">
            Log in op Pararius en rond eventuele verificatie af. Sluit dit
            venster niet. We slaan daarna je sessie veilig op.
          </p>
        </div>

        {/* Screenshot area */}
        <div className="px-6 py-4">
          <div
            className="relative bg-slate-100 rounded-lg overflow-hidden"
            style={{ aspectRatio: '900 / 650' }}
          >
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-sm text-slate-600">
                  Browser starten...
                </span>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            )}

            {screenshot && (
              <>
                <img
                  ref={imgRef}
                  src={`data:image/jpeg;base64,${screenshot}`}
                  alt="Pararius login"
                  className="w-full h-full object-contain cursor-pointer select-none"
                  onClick={handleScreenshotClick}
                  draggable={false}
                />
                {loading && (
                  <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                    <svg
                      className="animate-spin h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                )}
              </>
            )}
          </div>

          {sessionActive && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              Klik op het browservenster om te navigeren. Typ om tekst in te
              voeren.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
