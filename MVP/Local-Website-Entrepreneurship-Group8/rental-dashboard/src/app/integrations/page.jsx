'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ParariusConnectModal from '@/components/ParariusConnectModal';

export default function IntegrationsPage() {
  const [user, setUser] = useState(null);
  const [letter, setLetter] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [excludedSite, setExcludedSite] = useState('');
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [filterSets, setFilterSets] = useState([]);

  // Pararius connect state
  const [parariusStatus, setParariusStatus] = useState('not_connected');
  const [connectedAt, setConnectedAt] = useState(null);
  const [parariusEmail, setParariusEmail] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Profile fields for AI letter generation + Pararius form auto-fill
  const [profile, setProfile] = useState({
    // Pararius auto-fill fields
    salutation: '',
    dateOfBirth: '',
    workSituation: '',
    grossIncome: '',
    guarantor: '',
    livingTogether: '',
    numberOfTenants: '',
    hasPets: false,
    desiredStartDate: '',
    desiredRentalPeriod: '',
    currentLivingSituation: '',
    // AI letter fields
    ageCategory: '',
    occupation: '',
    contractType: '',
    incomeDescription: '',
    household: '',
    smoking: '',
    pets: '',
    moveReason: '',
    preferredStartDate: '',
    documentsAvailable: '',
    viewingAvailability: '',
    workLocation: '',
    transportMode: '',
    importantPlaces: '',
    neighborhoodPrefs: '',
    personalNote: '',
    housingPrefs: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // AI letter generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiCountdown, setAiCountdown] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        setUser(d.user);
        setLetter(d.user?.defaultLetter || '');
        setPhone(d.user?.phone || '');
        setFirstName(d.user?.firstName || '');
        setLastName(d.user?.lastName || '');
        setFilterSets(d.user?.filterSets || []);
        setParariusStatus(d.user?.integrations?.pararius?.status || 'not_connected');
        setConnectedAt(d.user?.integrations?.pararius?.connectedAt || null);
        setParariusEmail(d.user?.integrations?.pararius?.email || null);
        setProfile({
          // Pararius auto-fill fields
          salutation: d.user?.salutation || '',
          dateOfBirth: d.user?.dateOfBirth || '',
          workSituation: d.user?.workSituation || '',
          grossIncome: d.user?.grossIncome || '',
          guarantor: d.user?.guarantor || '',
          livingTogether: d.user?.livingTogether || '',
          numberOfTenants: d.user?.numberOfTenants || '',
          hasPets: d.user?.hasPets || false,
          desiredStartDate: d.user?.desiredStartDate || '',
          desiredRentalPeriod: d.user?.desiredRentalPeriod || '',
          currentLivingSituation: d.user?.currentLivingSituation || '',
          // AI letter fields
          ageCategory: d.user?.ageCategory || '',
          occupation: d.user?.occupation || '',
          contractType: d.user?.contractType || '',
          incomeDescription: d.user?.incomeDescription || '',
          household: d.user?.household || '',
          smoking: d.user?.smoking || '',
          pets: d.user?.pets || '',
          moveReason: d.user?.moveReason || '',
          preferredStartDate: d.user?.preferredStartDate || '',
          documentsAvailable: d.user?.documentsAvailable || '',
          viewingAvailability: d.user?.viewingAvailability || '',
          workLocation: d.user?.workLocation || '',
          transportMode: d.user?.transportMode || '',
          importantPlaces: d.user?.importantPlaces || '',
          neighborhoodPrefs: d.user?.neighborhoodPrefs || '',
          personalNote: d.user?.personalNote || '',
          housingPrefs: d.user?.housingPrefs || '',
        });
      });
  }, []);

  async function saveProfile() {
    setSaving(true);
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', data: { phone, firstName, lastName, ...profile } }),
    });
    setSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  // AI countdown timer
  useEffect(() => {
    if (aiCountdown === null || aiCountdown <= 0) return;
    const interval = setInterval(() => {
      setAiCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [aiCountdown]);

  async function generateAiLetter() {
    setAiGenerating(true);
    setAiError(null);
    setAiCountdown(null);
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'default' }),
      });
      const data = await res.json();
      if (data.rateLimited) {
        setAiCountdown(data.retryAfter);
      } else if (data.error) {
        setAiError(data.error);
      } else {
        setLetter(data.letter || '');
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function saveLetter() {
    setSaving(true);
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', data: { defaultLetter: letter, phone } }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch('/api/pararius/disconnect', { method: 'POST' });
    setParariusStatus('not_connected');
    setConnectedAt(null);
    setParariusEmail(null);
    setDisconnecting(false);
  }

  async function handleConnected() {
    setShowConnectModal(false);
    setParariusStatus('connected');
    setConnectedAt(new Date().toISOString());
    // Re-fetch to get the email extracted during login
    const d = await fetch('/api/user').then(r => r.json());
    setParariusEmail(d.user?.integrations?.pararius?.email || null);
    setConnectedAt(d.user?.integrations?.pararius?.connectedAt || new Date().toISOString());
  }

  async function addExcludedSite() {
    if (!excludedSite.trim()) return;
    const current = user?.excludedSites || [];
    if (current.includes(excludedSite.trim())) return;
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', data: { excludedSites: [...current, excludedSite.trim()] } }),
    });
    setExcludedSite('');
    const d = await fetch('/api/user').then(r => r.json());
    setUser(d.user);
  }

  async function removeExcludedSite(site) {
    const current = (user?.excludedSites || []).filter(s => s !== site);
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'general', data: { excludedSites: current } }),
    });
    const d = await fetch('/api/user').then(r => r.json());
    setUser(d.user);
  }

  // Build scrape URLs from active filter sets
  function buildScrapeUrl(fs) {
    const city = 'amsterdam'; // default, could be extended
    const price = (fs.minPrice || fs.maxPrice < 9999)
      ? `/${fs.minPrice || 0}-${fs.maxPrice || 9999}`
      : '';
    const beds = fs.bedrooms > 0 ? `/${fs.bedrooms}-bedrooms` : '';
    return `https://www.pararius.com/apartments/${city}${price}${beds}/`;
  }

  async function runScrape() {
    setScraping(true);
    setScrapeResult(null);

    const active = filterSets.filter(f => f.active);
    const urls = active.length > 0
      ? active.map(buildScrapeUrl)
      : ['https://www.pararius.com/apartments/amsterdam/'];

    const uniqueUrls = [...new Set(urls)];
    let totalScraped = 0, totalAdded = 0;

    try {
      for (const url of uniqueUrls) {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        totalScraped += data.scraped || 0;
        totalAdded += data.added || 0;
      }
      setScrapeResult({ scraped: totalScraped, added: totalAdded, urls: uniqueUrls.length });
    } catch (err) {
      setScrapeResult({ error: err.message });
    } finally {
      setScraping(false);
    }
  }

  const parariusConnected = parariusStatus === 'connected';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
            <p className="text-slate-500 mt-1">Connect rental platforms and configure auto-apply settings.</p>
          </div>

          {/* Integration Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Pararius Tile */}
            <div className={`bg-white rounded-xl border-2 p-5 shadow-sm transition-colors ${
              parariusConnected ? 'border-emerald-300' : parariusStatus === 'needs_reconnect' ? 'border-amber-300' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <img src="/logos/pararius.png" alt="Pararius" className="w-10 h-10 rounded-lg object-contain" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-800">Pararius</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {parariusStatus === 'connected' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-500">
                          Verbonden
                          {connectedAt && ` · ${new Date(connectedAt).toLocaleDateString('nl-NL')}`}
                        </span>
                      </>
                    )}
                    {parariusStatus === 'not_connected' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-500">Niet verbonden</span>
                      </>
                    )}
                    {parariusStatus === 'needs_reconnect' && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">Sessie verlopen</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected email */}
              {parariusEmail && parariusStatus === 'connected' && (
                <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Verbonden als</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{parariusEmail}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {parariusStatus === 'not_connected' && (
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Verbinden
                  </button>
                )}
                {parariusStatus === 'connected' && (
                  <>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Reconnect
                    </button>
                  </>
                )}
                {parariusStatus === 'needs_reconnect' && (
                  <>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Reconnect
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                    >
                      {disconnecting ? '...' : 'Disconnect'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Huurwoningen.nl Tile */}
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <img src="/logos/Huurwoningen_logo.png" alt="Huurwoningen.nl" className="w-10 h-10 rounded-lg object-contain" />
                <div>
                  <h2 className="font-semibold text-slate-800">Huurwoningen.nl</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">Nog niet beschikbaar</span>
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <button
                disabled
                className="w-full mt-3 px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>

            {/* Funda Tile */}
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <img src="/logos/Funda_Logo.png" alt="Funda" className="w-10 h-10 rounded-lg object-contain" />
                <div>
                  <h2 className="font-semibold text-slate-800">Funda</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">Nog niet beschikbaar</span>
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <button
                disabled
                className="w-full mt-3 px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Pararius Details (scrape & auto-apply) - only shown when connected or has filter sets */}
          {(parariusConnected || filterSets.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Pararius - Instellingen</h2>

              {/* Manual scrape */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Manual Scrape</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fetches up to 50 listings per active filter set (max). Currently {filterSets.filter(f => f.active).length} active filter{filterSets.filter(f => f.active).length !== 1 ? 's' : ''}.
                    </p>
                    {filterSets.filter(f => f.active).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {filterSets.filter(f => f.active).map(f => (
                          <span key={f.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={runScrape}
                    disabled={scraping}
                    className="flex-shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {scraping ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Scraping…
                      </>
                    ) : '↻ Scrape Now'}
                  </button>
                </div>
                {scrapeResult && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${scrapeResult.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {scrapeResult.error
                      ? `Error: ${scrapeResult.error}`
                      : `✓ Scraped ${scrapeResult.scraped} listings across ${scrapeResult.urls} URL(s) · ${scrapeResult.added} new added`}
                  </div>
                )}
              </div>

              {/* Auto-apply status */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Auto-Apply via Playwright
                      {parariusConnected && (
                        <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Ready</span>
                      )}
                      {!parariusConnected && (
                        <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Niet verbonden</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {parariusConnected
                        ? 'Klik "Apply on Pararius" op een match in de Matches pagina.'
                        : 'Verbind hierboven met Pararius om de Apply-knop in te schakelen.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal profile for AI letter generation + Pararius auto-fill */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <span>👤</span> Personal Profile
            </h2>
            <p className="text-xs text-slate-400 mb-5">These fields are used to auto-fill the Pararius contact form and generate personalized motivation letters.</p>

            {/* ── Pararius Form Fields ─────────────────────────────────────── */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                Pararius Form Fields
                <span className="text-xs font-normal text-slate-400">- auto-filled when applying</span>
              </h3>

              {/* Mijn gegevens */}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Mijn gegevens</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Aanhef</label>
                  <select value={profile.salutation} onChange={e => setProfile(p => ({ ...p, salutation: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="Heer">Heer</option>
                    <option value="Mevrouw">Mevrouw</option>
                    <option value="Zeg ik liever niet">Zeg ik liever niet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Voornaam</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Hidde" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Achternaam</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Franke" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Telefoonnummer</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0653196851" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Geboortedatum</label>
                  <input type="date" value={profile.dateOfBirth} onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Huurprofiel */}
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-3">Huurprofiel</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Werksituatie</label>
                  <select value={profile.workSituation} onChange={e => setProfile(p => ({ ...p, workSituation: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="Werkzaam bij werkgever">Werkzaam bij werkgever</option>
                    <option value="Ondernemer of ZZP-er">Ondernemer of ZZP-er</option>
                    <option value="Student">Student</option>
                    <option value="Gepensioneerd">Gepensioneerd</option>
                    <option value="Niet werkzaam">Niet werkzaam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Totaal bruto inkomen</label>
                  <select value={profile.grossIncome} onChange={e => setProfile(p => ({ ...p, grossIncome: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="€0 per maand">&euro;0 per maand</option>
                    <option value="€0 - €500 per maand">&euro;0 - &euro;500 per maand</option>
                    <option value="€500 - €1000 per maand">&euro;500 - &euro;1000 per maand</option>
                    <option value="€1000 - €1500 per maand">&euro;1000 - &euro;1500 per maand</option>
                    <option value="€1500 - €2000 per maand">&euro;1500 - &euro;2000 per maand</option>
                    <option value="€2000 - €2500 per maand">&euro;2000 - &euro;2500 per maand</option>
                    <option value="€2500 - €3000 per maand">&euro;2500 - &euro;3000 per maand</option>
                    <option value="€3000 - €3500 per maand">&euro;3000 - &euro;3500 per maand</option>
                    <option value="€3500 - €4000 per maand">&euro;3500 - &euro;4000 per maand</option>
                    <option value="€4000 - €4500 per maand">&euro;4000 - &euro;4500 per maand</option>
                    <option value="€4500 - €5000 per maand">&euro;4500 - &euro;5000 per maand</option>
                    <option value="€5000 - €5500 per maand">&euro;5000 - &euro;5500 per maand</option>
                    <option value="€5500 - €6000 per maand">&euro;5500 - &euro;6000 per maand</option>
                    <option value="€6000 - €6500 per maand">&euro;6000 - &euro;6500 per maand</option>
                    <option value="€6500 - €7000 per maand">&euro;6500 - &euro;7000 per maand</option>
                    <option value="€7000 - €7500 per maand">&euro;7000 - &euro;7500 per maand</option>
                    <option value="€7500 - €8000 per maand">&euro;7500 - &euro;8000 per maand</option>
                    <option value="€8000 - €8500 per maand">&euro;8000 - &euro;8500 per maand</option>
                    <option value="€8500 - €9000 per maand">&euro;8500 - &euro;9000 per maand</option>
                    <option value="€9000 - €9500 per maand">&euro;9000 - &euro;9500 per maand</option>
                    <option value="€9500 - €10000 per maand">&euro;9500 - &euro;10000 per maand</option>
                    <option value="€10.000+ per maand">&euro;10.000+ per maand</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Garantsteller</label>
                  <select value={profile.guarantor} onChange={e => setProfile(p => ({ ...p, guarantor: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="Geen garantsteller">Geen garantsteller</option>
                    <option value="Garantsteller woonachtig in Nederland">Garantsteller woonachtig in Nederland</option>
                    <option value="Garantsteller woonachtig in het buitenland">Garantsteller woonachtig in het buitenland</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ga je samenwonen?</label>
                  <select value={profile.livingTogether} onChange={e => setProfile(p => ({ ...p, livingTogether: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="Nee">Nee</option>
                    <option value="Ja, met partner">Ja, met partner</option>
                    <option value="Ja, met familie">Ja, met familie</option>
                    <option value="Ja, met vriend(en)">Ja, met vriend(en)</option>
                  </select>
                </div>
              </div>
              {profile.livingTogether && profile.livingTogether !== 'Nee' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Aantal huurders</label>
                  <input type="number" min="2" max="10" value={profile.numberOfTenants} onChange={e => setProfile(p => ({ ...p, numberOfTenants: e.target.value }))} placeholder="e.g. 2" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="hasPets" checked={profile.hasPets} onChange={e => setProfile(p => ({ ...p, hasPets: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="hasPets" className="text-sm text-slate-700">Ik heb een of meerdere huisdieren</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Gewenste ingangsdatum</label>
                  <input type="date" value={profile.desiredStartDate} onChange={e => setProfile(p => ({ ...p, desiredStartDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Gewenste huurperiode</label>
                  <select value={profile.desiredRentalPeriod} onChange={e => setProfile(p => ({ ...p, desiredRentalPeriod: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Selecteer --</option>
                    <option value="Onbepaalde tijd">Onbepaalde tijd</option>
                    <option value="0 - 3 maanden">0 - 3 maanden</option>
                    <option value="3 - 6 maanden">3 - 6 maanden</option>
                    <option value="6 - 12 maanden">6 - 12 maanden</option>
                    <option value="1 - 2 jaar">1 - 2 jaar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Huidige woonsituatie</label>
                <select value={profile.currentLivingSituation} onChange={e => setProfile(p => ({ ...p, currentLivingSituation: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Selecteer --</option>
                  <option value="Ik huur een huis">Ik huur een huis</option>
                  <option value="Ik bezit een huis">Ik bezit een huis</option>
                  <option value="Ik ben inwonend">Ik ben inwonend</option>
                </select>
              </div>
            </div>

            {/* ── AI Letter Profile ────────────────────────────────────────── */}
            <div className="space-y-3 mb-5 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                AI Letter Profile
                <span className="text-xs font-normal text-slate-400">- used for generating motivation letters</span>
              </h3>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Age Category</label>
                  <input type="text" value={profile.ageCategory} onChange={e => setProfile(p => ({ ...p, ageCategory: e.target.value }))} placeholder="e.g. 25-30" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Occupation</label>
                  <input type="text" value={profile.occupation} onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))} placeholder="e.g. Data Scientist bij ING" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contract Type</label>
                  <input type="text" value={profile.contractType} onChange={e => setProfile(p => ({ ...p, contractType: e.target.value }))} placeholder="e.g. vast contract" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Income Description</label>
                  <input type="text" value={profile.incomeDescription} onChange={e => setProfile(p => ({ ...p, incomeDescription: e.target.value }))} placeholder="e.g. ruim boven de inkomenseis" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Household</label>
                  <input type="text" value={profile.household} onChange={e => setProfile(p => ({ ...p, household: e.target.value }))} placeholder="e.g. samen met partner" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Smoking</label>
                  <input type="text" value={profile.smoking} onChange={e => setProfile(p => ({ ...p, smoking: e.target.value }))} placeholder="e.g. nee" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Pets (text for letter)</label>
                <input type="text" value={profile.pets} onChange={e => setProfile(p => ({ ...p, pets: e.target.value }))} placeholder="e.g. nee / 1 kat" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Relocation details */}
            <div className="space-y-3 mb-5 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Relocation Details</h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reason for Moving</label>
                <input type="text" value={profile.moveReason} onChange={e => setProfile(p => ({ ...p, moveReason: e.target.value }))} placeholder="e.g. dichter bij werk wonen" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Preferred Start Date (text for letter)</label>
                  <input type="text" value={profile.preferredStartDate} onChange={e => setProfile(p => ({ ...p, preferredStartDate: e.target.value }))} placeholder="e.g. per direct / 1 maart 2026" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Viewing Availability</label>
                  <input type="text" value={profile.viewingAvailability} onChange={e => setProfile(p => ({ ...p, viewingAvailability: e.target.value }))} placeholder="e.g. flexibel, doordeweeks na 17:00" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Documents Available</label>
                <input type="text" value={profile.documentsAvailable} onChange={e => setProfile(p => ({ ...p, documentsAvailable: e.target.value }))} placeholder="e.g. loonstroken, werkgeversverklaring, ID, verhuurdersverklaring" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Location & lifestyle */}
            <div className="space-y-3 mb-5 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Location & Lifestyle</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Work Location(s)</label>
                  <input type="text" value={profile.workLocation} onChange={e => setProfile(p => ({ ...p, workLocation: e.target.value }))} placeholder="e.g. Zuidas, Amsterdam" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Transport Mode</label>
                  <input type="text" value={profile.transportMode} onChange={e => setProfile(p => ({ ...p, transportMode: e.target.value }))} placeholder="e.g. fiets en OV" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Important Places</label>
                <input type="text" value={profile.importantPlaces} onChange={e => setProfile(p => ({ ...p, importantPlaces: e.target.value }))} placeholder="e.g. sportschool, familie in Haarlem, Vondelpark" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Neighbourhood Preferences</label>
                <input type="text" value={profile.neighborhoodPrefs} onChange={e => setProfile(p => ({ ...p, neighborhoodPrefs: e.target.value }))} placeholder="e.g. rustig, goed verbonden, groen, veilig" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Personal preferences */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Personal Preferences</h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Housing Preferences</label>
                <input type="text" value={profile.housingPrefs} onChange={e => setProfile(p => ({ ...p, housingPrefs: e.target.value }))} placeholder="e.g. veel licht, rustig, ruimte voor thuiswerken" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Personal Note</label>
                <textarea value={profile.personalNote} onChange={e => setProfile(p => ({ ...p, personalNote: e.target.value }))} rows={3} placeholder="e.g. Ik werk veel thuis en waardeer een rustige omgeving. In mijn vrije tijd fiets ik graag door de stad." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                <p className="text-xs text-slate-400 mt-1">Optional: adds a personal touch to your AI-generated letters.</p>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Profile'}
            </button>
          </div>

          {/* Default cover letter */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <span>✉️</span> Default Cover Letter
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Use <code className="bg-slate-100 px-1 rounded">{'{{ADDRESS}}'}</code> and <code className="bg-slate-100 px-1 rounded">{'{{NAME}}'}</code> as placeholders. You can write your own or generate one with AI based on your profile.
            </p>

            {/* AI generation rate limit countdown */}
            {aiCountdown !== null && aiCountdown > 0 && (
              <div className="mb-4 flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-sm font-medium text-violet-800">AI letter limit reached</p>
                  <p className="text-xs text-violet-600">
                    Next generation available in{' '}
                    <span className="font-mono font-bold tabular-nums">
                      {String(Math.floor(aiCountdown / 60)).padStart(2, '0')}:{String(aiCountdown % 60).padStart(2, '0')}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {aiCountdown === 0 && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                <span className="text-sm text-emerald-600 font-medium">Ready to generate again!</span>
              </div>
            )}

            {/* AI error */}
            {aiError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {aiError}
                {aiError.includes('ANTHROPIC_API_KEY') && (
                  <p className="mt-2 text-xs">Add <code className="bg-red-100 px-1 rounded">ANTHROPIC_API_KEY=sk-ant-…</code> to your <code className="bg-red-100 px-1 rounded">.env.local</code> file and restart the server.</p>
                )}
              </div>
            )}

            <textarea
              value={letter}
              onChange={e => setLetter(e.target.value)}
              rows={10}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
              placeholder="Dear landlord,&#10;&#10;My name is {{NAME}} and I am interested in the apartment at {{ADDRESS}}..."
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveLetter}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Letter'}
              </button>
              <button
                onClick={generateAiLetter}
                disabled={aiGenerating}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Generating…
                  </>
                ) : '✨ Generate with AI'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">AI generation uses your Personal Profile above. Limited to once per hour.</p>
          </div>

          {/* Excluded sites */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>🚫</span> Excluded Sites
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={excludedSite}
                onChange={e => setExcludedSite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExcludedSite()}
                placeholder="e.g. kamernet.nl"
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addExcludedSite}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(user?.excludedSites || []).map(site => (
                <span key={site} className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                  {site}
                  <button onClick={() => removeExcludedSite(site)} className="hover:text-red-900">×</button>
                </span>
              ))}
              {!(user?.excludedSites?.length) && (
                <p className="text-xs text-slate-400">No sites excluded</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <ParariusConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={handleConnected}
      />
    </div>
  );
}
