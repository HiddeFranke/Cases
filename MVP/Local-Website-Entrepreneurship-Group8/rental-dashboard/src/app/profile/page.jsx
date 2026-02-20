'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => { setUser(d.user); setLoading(false); });
  }, []);

  function exportData() {
    setExporting(true);
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'woonplek-data.json';
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading profile…</div>
      </main>
    </div>
  );

  const pararius = user?.integrations?.pararius;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
            <p className="text-slate-500 mt-1">Your account details and subscription information.</p>
          </div>

          {/* User info */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{user?.username}</h2>
                <p className="text-slate-500 text-sm">{user?.email || 'No email set'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Username" value={user?.username} />
              <InfoRow label="Email" value={user?.email || '–'} />
              <InfoRow label="Member Since" value={user?.memberSince || '–'} />
              <InfoRow
                label="Subscription"
                value={
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                    user?.subscription === 'Free Trial' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user?.subscription}
                  </span>
                }
              />
            </div>
          </div>

          {/* Integrations overview */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">Connected Integrations</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">P</div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Pararius</p>
                    {pararius?.status === 'connected' ? (
                      <p className="text-xs text-slate-400">{pararius?.email || 'No email available'}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Not connected</p>
                    )}
                    {pararius?.status === 'connected' && pararius?.connectedAt && (
                      <p className="text-xs text-slate-400">Connected on {new Date(pararius.connectedAt).toLocaleDateString('nl-NL')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {pararius?.status === 'connected' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-medium text-emerald-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <Link href="/integrations" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        Connect
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              More platforms (Funda, Kamernet) will be added in future versions.
            </p>
          </div>

          {/* Support & docs */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">Help & Support</h2>
            <div className="space-y-3">
              <SupportLink icon="📚" label="Documentation" href="#" description="Learn how to use Woonplek" />
              <SupportLink icon="✉️" label="Contact Support" href="mailto:support@woonplek.nl" description="support@woonplek.nl" />
              <SupportLink icon="🔒" label="Privacy Policy" href="#" description="How we handle your data" />
            </div>
          </div>

          {/* Data export */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-2">Data Export</h2>
            <p className="text-sm text-slate-500 mb-4">
              Download all your stored data (preferences, integrations, filters) as a JSON file.
            </p>
            <button
              onClick={exportData}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Preparing…' : 'Download My Data'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function SupportLink({ icon, label, href, description }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-medium text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <svg className="w-4 h-4 text-slate-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
