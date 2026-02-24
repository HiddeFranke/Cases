'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ───────────── icons (inline SVG – no emoji) ───────────── */

function IconHome({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function IconMap({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-12.053l-2.998-1.875a.747.747 0 00-.756 0l-3 1.875-3-1.875a.747.747 0 00-1.003.53v13.5a.75.75 0 001.003.53l3-1.875 3 1.875 3-1.875a.75.75 0 001.003-.53V4.022a.75.75 0 00-1.003-.53l-.249.155z" />
    </svg>
  );
}
function IconFilter({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}
function IconRobot({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
function IconPlug({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}
function IconBolt({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
function IconCheck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function IconArrowRight({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
function IconPlay({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/* ───────────── animation hook ───────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ───────────── data ───────────── */

const features = [
  { icon: IconHome,   title: 'Smart Dashboard',      desc: 'All your applications, matches, and new listings in a single command center.' },
  { icon: IconMap,    title: 'Interactive Map',       desc: 'Browse listings on a map of Amsterdam. Filter by neighbourhood to find your area.' },
  { icon: IconFilter, title: 'Precision Filters',     desc: 'Budget, size, neighbourhood, furnished — see only what truly fits your criteria.' },
  { icon: IconRobot,  title: 'AI Auto-Apply',         desc: 'One click and our AI writes a personalised cover letter and applies for you.' },
  { icon: IconPlug,   title: 'Pararius Integration',  desc: 'Connect your Pararius account and let Woonplek scrape new listings automatically.' },
  { icon: IconBolt,   title: 'Expert Rental Tips',    desc: 'Insider tips on what landlords look for so you stand out from the crowd.' },
];

const stats = [
  { value: '3x',   label: 'More replies than manual applications' },
  { value: '<2 min', label: 'From new listing to submitted application' },
  { value: '500+', label: 'Listings monitored across Amsterdam' },
];

const steps = [
  { num: '01', title: 'Set your preferences', desc: 'Tell us your budget, preferred neighbourhoods, and move-in date.' },
  { num: '02', title: 'Connect Pararius',      desc: 'Link your account so Woonplek can monitor listings in real-time.' },
  { num: '03', title: 'Review & auto-apply',   desc: 'Browse matches on the map and let AI apply with one click.' },
];

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const heroAnim = useInView();
  const featAnim = useInView();
  const statsAnim = useInView();
  const stepsAnim = useInView();
  const ctaAnim = useInView();

  function handlePlayVideo() {
    if (videoRef.current) {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#060B18] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#060B18]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-shadow duration-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-blue-500">Woon</span>plek
            </span>
          </Link>

          {/* desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">How It Works</a>
            <a href="#demo" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer">Demo</a>
          </div>

          {/* auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              Log in
            </Link>
            <button
              onClick={() => alert('Sign up coming soon!')}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* mobile menu btn */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-[#060B18]/95 backdrop-blur-xl border-t border-white/5 px-6 pb-6 pt-4 space-y-4">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-300 hover:text-white cursor-pointer">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-300 hover:text-white cursor-pointer">How It Works</a>
            <a href="#demo" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-300 hover:text-white cursor-pointer">Demo</a>
            <hr className="border-white/10" />
            <Link href="/login" className="block text-sm text-slate-300 hover:text-white cursor-pointer">Log in</Link>
            <button
              onClick={() => alert('Sign up coming soon!')}
              className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-[150px]" />
        </div>
        {/* grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div
          ref={heroAnim.ref}
          className={`relative max-w-7xl mx-auto px-6 text-center transition-all duration-1000 ${
            heroAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Now monitoring 500+ Amsterdam listings
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Stop hunting.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-400">
              Start finding.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Woonplek monitors Amsterdam rental sites, matches listings to your preferences, and auto-applies with AI-written cover letters — so you can finally win the apartment race.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => alert('Sign up coming soon!')}
              className="group px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              Get Started Free
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <a
              href="#demo"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Watch Demo
            </a>
          </div>

          {/* trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-emerald-500" /> Free to start</span>
            <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEO ── */}
      <section id="demo" className="relative pb-24 lg:pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 bg-[#0a0f1e]">
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 flex-1 text-center text-xs text-slate-500 font-mono">woonplek.nl</span>
            </div>
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                src="/woonplek-demo.mp4"
                className="w-full h-full object-cover"
                playsInline
                muted
                onEnded={() => setVideoPlaying(false)}
                onPause={() => setVideoPlaying(false)}
                onPlay={() => setVideoPlaying(true)}
              />
              {/* play overlay */}
              {!videoPlaying && (
                <button
                  onClick={handlePlayVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors duration-300 cursor-pointer group"
                  aria-label="Play demo video"
                >
                  <div className="w-20 h-20 rounded-full bg-blue-600/90 flex items-center justify-center shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                    <IconPlay className="w-8 h-8 text-white ml-1" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative py-16 border-y border-white/5">
        <div
          ref={statsAnim.ref}
          className={`max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-center transition-all duration-1000 ${
            statsAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {s.value}
              </div>
              <p className="mt-2 text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>

        <div
          ref={featAnim.ref}
          className={`relative max-w-7xl mx-auto px-6 transition-all duration-1000 ${
            featAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Everything you need to land your apartment
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
              From discovery to application — Woonplek handles the entire workflow so you don&apos;t have to.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-600/15 transition-colors duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative py-24 lg:py-32 bg-white/[0.01]">
        <div
          ref={stepsAnim.ref}
          className={`max-w-5xl mx-auto px-6 transition-all duration-1000 ${
            stepsAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm tracking-wide uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Three steps to your new home
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative" style={{ transitionDelay: `${i * 100}ms` }}>
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 text-blue-400 text-xl font-bold mb-6">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
        </div>
        <div
          ref={ctaAnim.ref}
          className={`relative max-w-3xl mx-auto px-6 text-center transition-all duration-1000 ${
            ctaAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to find your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Amsterdam home?
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto">
            Join hundreds of expats who stopped refreshing listings and started getting replies.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => alert('Sign up coming soon!')}
              className="group px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              Get Started Free
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <Link
              href="/login"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="font-bold text-white">Woonplek</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-300 transition-colors duration-200 cursor-pointer">Features</a>
            <a href="#how-it-works" className="hover:text-slate-300 transition-colors duration-200 cursor-pointer">How It Works</a>
            <a href="#demo" className="hover:text-slate-300 transition-colors duration-200 cursor-pointer">Demo</a>
          </div>
          <p className="text-sm text-slate-600">&copy; 2026 Woonplek. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
