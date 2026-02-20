'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

const STATUS_STYLES = {
  queued: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Queued', dot: 'bg-amber-400' },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Running', dot: 'bg-blue-500' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Failed', dot: 'bg-red-500' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '–';
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function duration(start, end) {
  if (!start) return '–';
  const endTime = end ? new Date(end).getTime() : Date.now();
  const secs = Math.floor((endTime - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function AgentsPage() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ queued: 0, running: 0, completed: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [headless, setHeadless] = useState(false);
  const pollRef = useRef(null);

  async function fetchJobs() {
    try {
      const data = await fetch('/api/agents').then(r => r.json());
      setJobs(data.jobs || []);
      setStats(data.stats || {});
      setLoading(false);
      return data.stats;
    } catch {
      setLoading(false);
      return null;
    }
  }

  useEffect(() => {
    fetchJobs();
    // Load headless preference
    fetch('/api/user').then(r => r.json()).then(d => {
      setHeadless(d.user?.playwrightHeadless ?? false);
    });

    // Poll every 3s while there are active jobs
    function startPolling() {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const s = await fetchJobs();
        if (s && s.queued === 0 && s.running === 0) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 3000);
    }
    startPolling();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Restart polling when a running/queued job appears
  useEffect(() => {
    if ((stats.queued > 0 || stats.running > 0) && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const s = await fetchJobs();
        if (s && s.queued === 0 && s.running === 0) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 3000);
    }
  }, [stats.queued, stats.running]);

  async function handleClearCompleted() {
    setClearing(true);
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await fetchJobs();
    setClearing(false);
  }

  async function handleRemoveJob(id) {
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await fetchJobs();
  }

  async function toggleHeadless() {
    const next = !headless;
    setHeadless(next);
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', data: { playwrightHeadless: next } }),
    });
  }

  const hasFinished = stats.completed > 0 || stats.failed > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8" style={{ height: '100vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Agents</h1>
            <p className="text-sm text-slate-500 mt-0.5">Apply queue &amp; automation status</p>
          </div>
          {hasFinished && (
            <button
              onClick={handleClearCompleted}
              disabled={clearing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear finished'}
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="text-2xl font-bold text-amber-700">{stats.queued}</div>
            <div className="text-xs font-medium text-amber-600 mt-0.5">Queued</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{stats.running}</div>
            <div className="text-xs font-medium text-blue-600 mt-0.5">Running</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-700">{stats.completed}</div>
            <div className="text-xs font-medium text-emerald-600 mt-0.5">Completed</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
            <div className="text-xs font-medium text-red-600 mt-0.5">Failed</div>
          </div>
        </div>

        {/* Queue settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">Queue Configuration</div>
              <div className="text-xs text-slate-400 mt-0.5">Concurrency limit for automated agents</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700">1</span>
                <span className="text-xs text-slate-400">max concurrent</span>
              </div>
              <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded border border-slate-200">Local mode</span>
            </div>
          </div>

          {/* Playwright mode toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="text-sm font-semibold text-slate-700">Browser Mode</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {headless
                  ? 'Headless — browser draait onzichtbaar op de achtergrond'
                  : 'Visible — browser opent als zichtbaar venster'}
              </div>
            </div>
            <button
              onClick={toggleHeadless}
              className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                headless ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span className="sr-only">Toggle headless mode</span>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                headless ? 'translate-x-[28px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              headless
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {headless ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                  Headless
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visible
                </>
              )}
            </span>
            <span className="text-xs text-slate-400">
              {headless ? 'Sneller, geen zichtbaar browservenster' : 'Je ziet de browser live het formulier invullen'}
            </span>
          </div>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600 text-lg">No agent jobs yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              When you apply to a property from the Matches page, the automation agent will appear here so you can track its progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, idx) => {
              const style = STATUS_STYLES[job.status] || STATUS_STYLES.queued;
              const isActive = job.status === 'queued' || job.status === 'running';
              const queuePos = isActive
                ? jobs.filter(j => (j.status === 'queued' || j.status === 'running') && new Date(j.createdAt) <= new Date(job.createdAt)).length
                : null;

              return (
                <div key={job.id} className={`bg-white rounded-xl border ${isActive ? style.border : 'border-slate-100'} p-5 transition-all`}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                          {job.status === 'running' && (
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${job.status === 'running' ? 'hidden' : ''}`} />
                          {style.label}
                        </span>
                        {queuePos && (
                          <span className="text-xs text-slate-400 font-medium">#{queuePos} in queue</span>
                        )}
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Applied
                          </span>
                        )}
                        {job.usedAILetter && (
                          <span className="text-xs text-violet-500 font-medium">AI letter</span>
                        )}
                      </div>

                      {/* Property name */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{job.propertyName}</span>
                        {job.propertyUrl && (
                          <a
                            href={job.propertyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0"
                          >
                            View listing
                          </a>
                        )}
                      </div>

                      {/* Result or error */}
                      {job.result && (
                        <p className="text-sm text-emerald-600 mt-1">{job.result}</p>
                      )}
                      {job.error && (
                        <p className="text-sm text-red-600 mt-1">{job.error}</p>
                      )}

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>Created {formatTime(job.createdAt)}</span>
                        {job.startedAt && <span>Started {timeAgo(job.startedAt)}</span>}
                        {job.completedAt && (
                          <span>Duration: {duration(job.startedAt, job.completedAt)}</span>
                        )}
                        {job.status === 'running' && job.startedAt && (
                          <span className="text-blue-500 font-medium">Running for {duration(job.startedAt, null)}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Type badge */}
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 capitalize">
                        {job.type}
                      </span>
                      {!isActive && (
                        <button
                          onClick={() => handleRemoveJob(job.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
