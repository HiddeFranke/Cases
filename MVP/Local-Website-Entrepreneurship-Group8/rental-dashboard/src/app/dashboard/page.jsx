'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

const QUICK_LINKS = [
  { href: '/matches', label: 'View Matches', color: 'bg-blue-600', icon: '🗺️' },
  { href: '/filters', label: 'Set Filters', color: 'bg-emerald-600', icon: '⚙️' },
  { href: '/integrations', label: 'Integrations', color: 'bg-violet-600', icon: '🔗' },
  { href: '/tips', label: 'Profile Tips', color: 'bg-amber-500', icon: '💡' },
];

function getGreeting(name) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `${timeGreeting}, ${name || 'there'}! 👋`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/properties?state=all').then(r => r.json()),
      fetch('/api/user').then(r => r.json()),
    ]).then(([propData, userData]) => {
      setStats(propData.stats);
      const u = userData.user;
      setUser(u);

      // Build dynamic notifications
      const notes = [];
      const pararius = u?.integrations?.pararius;
      if (pararius?.status !== 'connected') {
        notes.push({
          id: 'no-pararius',
          color: 'amber',
          icon: '🔗',
          title: 'Connect Pararius',
          body: 'Add your credentials to enable scraping and auto-apply.',
          link: '/integrations',
          linkLabel: 'Set up →',
        });
      }
      if (!u?.defaultLetter) {
        notes.push({
          id: 'no-letter',
          color: 'blue',
          icon: '✉️',
          title: 'Write your cover letter',
          body: 'A personalised letter dramatically increases your response rate.',
          link: '/integrations',
          linkLabel: 'Write now →',
        });
      }
      if ((u?.filterSets || []).length === 0) {
        notes.push({
          id: 'no-filters',
          color: 'emerald',
          icon: '⚙️',
          title: 'Set up search filters',
          body: 'Define your budget and preferences so matches are relevant.',
          link: '/filters',
          linkLabel: 'Add filters →',
        });
      }
      if (propData.stats?.total === 0) {
        notes.push({
          id: 'no-data',
          color: 'slate',
          icon: '🏠',
          title: 'No listings yet',
          body: 'Go to Matches and click ↻ Refresh to fetch listings from Pararius.',
          link: '/matches',
          linkLabel: 'Go to Matches →',
        });
      }
      setNotifications(notes);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const appliedCount = stats ? (stats.total - stats.newCount - stats.interesting - stats.shortlisted - stats.hidden) : 0;

  const statCards = stats
    ? [
        { label: 'Total Listings', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏠', href: '/matches' },
        { label: 'New Listings', value: stats.newCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✨', href: '/matches' },
        { label: 'Shortlisted', value: stats.shortlisted, color: 'text-violet-600', bg: 'bg-violet-50', icon: '❤️', href: '/matches' },
        { label: 'Interesting', value: stats.interesting, color: 'text-amber-600', bg: 'bg-amber-50', icon: '⭐', href: '/matches' },
      ]
    : [];

  const colorMap = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', title: 'text-amber-800', body: 'text-amber-700', link: 'text-amber-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', title: 'text-blue-800', body: 'text-blue-700', link: 'text-blue-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', title: 'text-emerald-800', body: 'text-emerald-700', link: 'text-emerald-800' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-400', title: 'text-slate-700', body: 'text-slate-600', link: 'text-slate-700' },
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{getGreeting(user?.username)}</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your apartment search.</p>
        </div>

        {/* Dynamic notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(n => {
              const c = colorMap[n.color] || colorMap.slate;
              return (
                <div key={n.id} className={`p-4 ${c.bg} border ${c.border} rounded-xl flex items-start gap-3`}>
                  <span className={`${c.icon} text-lg flex-shrink-0`}>{n.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${c.title}`}>{n.title}</p>
                    <p className={`text-sm ${c.body} mt-0.5`}>
                      {n.body}{' '}
                      <Link href={n.link} className={`underline font-medium ${c.link}`}>{n.linkLabel}</Link>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse">
                  <div className="h-8 w-8 bg-slate-200 rounded-lg mb-3"></div>
                  <div className="h-7 w-12 bg-slate-200 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-slate-100 rounded"></div>
                </div>
              ))
            : statCards.map(card => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow block"
                >
                  <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
                    {card.icon}
                  </div>
                  <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
                </Link>
              ))
          }
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`${link.color} text-white rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity shadow-sm`}
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="font-semibold text-sm">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Recent New Matches</h2>
            <Link href="/matches" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <RecentMatches />
        </div>
      </main>
    </div>
  );
}

function RecentMatches() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/properties?state=new')
      .then(r => r.json())
      .then(d => { setProperties(d.properties?.slice(0, 5) || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm animate-pulse">Loading matches…</div>;
  if (!properties.length) return (
    <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
      <p className="text-4xl mb-2">🏠</p>
      <p className="font-medium">No new listings yet</p>
      <p className="text-sm mt-1">Go to <Link href="/matches" className="text-blue-500 underline">Matches</Link> and click ↻ Refresh to fetch listings.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 shadow-sm overflow-hidden">
      {properties.map(p => (
        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
          <div>
            <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-blue-600 text-sm">
              {p.name}
            </a>
            <div className="text-xs text-slate-400 mt-0.5">{p.neighborhood} · {p.surfaceArea}m² · {p.bedrooms} bed</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-800">€{p.price?.toLocaleString()}</div>
            <div className="text-xs text-slate-400">per month</div>
          </div>
        </div>
      ))}
    </div>
  );
}
