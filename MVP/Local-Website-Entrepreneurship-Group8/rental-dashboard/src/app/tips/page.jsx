'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

const TIPS = [
  {
    id: 1,
    category: 'Cover Letter',
    icon: '✉️',
    title: 'Write a compelling introduction',
    summary: 'A strong opening letter dramatically increases your response rate.',
    detail: `Your cover letter is often the first thing a landlord reads. Keep it concise (max 3 paragraphs) and cover:

• **Who you are** – name, age, occupation
• **Why this apartment** – be specific about what attracted you
• **Financial reliability** – mention stable income, job contract, or guarantor if needed
• **Your lifestyle** – quiet, no pets, no smoking if applicable

Stekkies research shows landlords respond 3× more often to personalised letters over generic ones.`,
  },
  {
    id: 2,
    category: 'Financial Documents',
    icon: '📄',
    title: 'Prepare your documents in advance',
    summary: 'Having documents ready gives you a major speed advantage.',
    detail: `Dutch landlords typically ask for:

• Recent payslips (last 3 months)
• Employment contract or employer statement
• Bank statements (last 3 months)
• Copy of passport/ID
• Proof of income (minimum 3× monthly rent is common)

Create a folder with scanned PDFs so you can send everything within minutes of receiving a viewing invitation.`,
  },
  {
    id: 3,
    category: 'Response Speed',
    icon: '⚡',
    title: 'React within the first hour',
    summary: 'Amsterdam is competitive – speed is everything.',
    detail: `Most listings receive 50+ responses within 24 hours. Platforms like Stekkies send notifications within 30 seconds of a new listing appearing. To maximise your chances:

• Enable notifications and check frequently
• Use Woonplek's auto-apply feature to respond instantly
• Have your cover letter template ready to personalise quickly
• Schedule viewings immediately – don't wait to "think about it"`,
  },
  {
    id: 4,
    category: 'Search Strategy',
    icon: '🗺️',
    title: 'Broaden your neighbourhood search',
    summary: 'Consider areas beyond the obvious hotspots.',
    detail: `Popular neighbourhoods like Jordaan and De Pijp have more competition. Consider also:

• **Amsterdam Noord** – fast-developing, IJ-waterfront views, great food scene
• **Nieuw-West** – more affordable, well-connected by tram/metro
• **Buitenveldert/Zuidas** – quiet, professional area near Vrije Universiteit
• **IJburg** – waterfront, newer buildings, growing community

Expanding your search by 2-3 neighbourhoods can double the number of relevant listings.`,
  },
  {
    id: 5,
    category: 'Profile',
    icon: '👤',
    title: 'Include a profile photo and bio',
    summary: 'A personal touch builds trust with landlords.',
    detail: `When given the option (e.g. on Pararius), add a friendly profile photo and short bio. Landlords often prefer tenants they can relate to. Mention:

• Your profession and stability
• Hobbies or interests (keeps it human)
• That you take good care of your living space
• Any positive references from previous landlords`,
  },
  {
    id: 6,
    category: 'Viewings',
    icon: '🏠',
    title: 'Ace the viewing',
    summary: 'The in-person meeting is your chance to close the deal.',
    detail: `• Arrive 5 minutes early – punctuality shows reliability
• Ask smart questions (energy costs, neighbourhood, neighbours)
• Express genuine enthusiasm – landlords want committed tenants
• Bring printed copies of your documents
• Send a thank-you message same day confirming your interest
• Follow up within 48 hours if you haven't heard back`,
  },
];

export default function TipsPage() {
  const [openId, setOpenId] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('readTips') || '[]');
    }
    return [];
  });

  function markRead(id) {
    const next = readIds.includes(id) ? readIds : [...readIds, id];
    setReadIds(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('readTips', JSON.stringify(next));
    }
  }

  function toggleTip(id) {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
      markRead(id);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Profile Tips</h1>
            <p className="text-slate-500 mt-1">
              Improve your rental application success rate with these expert tips.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(readIds.length / TIPS.length) * 100}%` }}
                ></div>
              </div>
              <span className="whitespace-nowrap font-medium text-emerald-600">
                {readIds.length}/{TIPS.length} read
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {TIPS.map(tip => (
              <div
                key={tip.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleTip(tip.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {tip.category}
                      </span>
                      {readIds.includes(tip.id) && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Read
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-800">{tip.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{tip.summary}</div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openId === tip.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openId === tip.id && (
                  <div className="px-5 pb-5 border-t border-slate-50">
                    <div className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {tip.detail}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
