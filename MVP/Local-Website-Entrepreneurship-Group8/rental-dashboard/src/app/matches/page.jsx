'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="flex-1 bg-slate-100 animate-pulse rounded-xl"></div> });

const STATE_COLORS = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'New' },
  interesting: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Interesting' },
  shortlisted: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Shortlisted' },
  hidden: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Hidden' },
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function buildScrapeUrls(filterSets) {
  const active = (filterSets || []).filter(f => f.active);
  if (active.length === 0) return ['https://www.pararius.com/apartments/amsterdam/'];
  return [...new Set(active.map(fs => {
    const price = (fs.minPrice > 0 || fs.maxPrice < 9999)
      ? `/${fs.minPrice || 0}-${fs.maxPrice || 9999}` : '';
    const beds = fs.bedrooms > 0 ? `/${fs.bedrooms}-bedrooms` : '';
    return `https://www.pararius.com/apartments/amsterdam${price}${beds}/`;
  }))];
}

// ── Filter Detail Popup ───────────────────────────────────────────────────────
function FilterDetailPopup({ filters }) {
  const MAX_PRICE = 4000;
  return (
    <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Active Filters</div>
      <div className="space-y-3">
        {filters.map(f => (
          <div key={f.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="font-semibold text-slate-800 text-sm mb-2">{f.name}</div>
            <div className="space-y-2">
              {/* Price bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Price</span>
                  <span className="text-xs font-semibold text-slate-700">€{f.minPrice?.toLocaleString()}–€{f.maxPrice?.toLocaleString()}/mo</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      marginLeft: `${Math.min((f.minPrice / MAX_PRICE) * 100, 100)}%`,
                      width: `${Math.min(((f.maxPrice - f.minPrice) / MAX_PRICE) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Bedrooms */}
              {f.bedrooms > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Bedrooms</span>
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{f.bedrooms}+</span>
                </div>
              )}
              {/* Surface */}
              {f.minSurface > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Min. surface</span>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{f.minSurface}m²+</span>
                </div>
              )}
              {/* Furnishing */}
              {f.furniture && f.furniture !== 'any' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Furnishing</span>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded capitalize">{f.furniture}</span>
                </div>
              )}
              {/* Neighborhoods */}
              {f.neighborhoods?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Areas</span>
                  <div className="flex flex-wrap gap-1">
                    {f.neighborhoods.map(n => (
                      <span key={n} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{n}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [view, setView] = useState('split');
  const [filterSets, setFilterSets] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const loadProperties = useCallback(async (fs) => {
    setLoading(true);
    const active = (fs || []).filter(f => f.active);
    let url = '/api/properties?state=visible';
    if (active.length > 0) {
      url += '&filterSets=' + encodeURIComponent(JSON.stringify(active));
    }
    const data = await fetch(url).then(r => r.json());
    setProperties(data.properties || []);
    setPage(1);
    setLoading(false);
  }, []);

  function handlePageSizeChange(newSize) {
    setPageSize(newSize);
    setPage(1);
  }

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        setUser(d.user);
        const fs = d.user?.filterSets || [];
        setFilterSets(fs);
        loadProperties(fs);
      });
  }, [loadProperties]);

  async function handleScrape() {
    setScraping(true);
    setScrapeResult(null);
    const urls = buildScrapeUrls(filterSets);
    let totalScraped = 0, totalAdded = 0;
    try {
      for (const url of urls) {
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
      setScrapeResult({ ok: true, scraped: totalScraped, added: totalAdded });
      await loadProperties(filterSets);
    } catch (err) {
      setScrapeResult({ ok: false, error: err.message });
    } finally {
      setScraping(false);
      setTimeout(() => setScrapeResult(null), 5000);
    }
  }

  async function updateState(id, state) {
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, state }),
    });
    setProperties(prev => prev.map(p => p.id === id ? { ...p, state } : p));
  }

  async function updateNote(id, notes) {
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes }),
    });
    setProperties(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
  }

  const visible = properties.filter(p => p.state !== 'hidden');
  const mapProperties = visible.filter(p => p.coordinates);
  const activeFilters = (filterSets || []).filter(f => f.active);

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.ceil(visible.length / pageSize);
  const paginated = pageSize === 0 ? visible : visible.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 flex flex-col" style={{ height: '100vh' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Matches</h1>
            <p className="text-sm text-slate-500 mt-0.5">{visible.length} matching apartments</p>
          </div>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <div
                className="relative flex items-center gap-1.5 mr-2"
                onMouseEnter={() => (view === 'map' || view === 'split') && setShowFilterPopup(true)}
                onMouseLeave={() => setShowFilterPopup(false)}
              >
                <span className="text-xs text-slate-400">Filters:</span>
                {activeFilters.map(f => (
                  <span key={f.id} className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full cursor-default">{f.name}</span>
                ))}
                {(view === 'map' || view === 'split') && (
                  <span className="text-xs text-slate-300 ml-0.5" title="Hover for details">ⓘ</span>
                )}
                {showFilterPopup && <FilterDetailPopup filters={activeFilters} />}
              </div>
            )}
            <span className="text-xs text-slate-400 mr-1">View:</span>
            {[
              { id: 'split', label: '⊞ Split' },
              { id: 'list', label: '☰ List' },
              { id: 'map', label: '🗺 Map' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  view === v.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {scraping ? (
                <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Scraping…</>
              ) : '↻ Refresh'}
            </button>
          </div>
        </div>

        {scrapeResult && (
          <div className={`px-6 py-2 text-sm font-medium flex-shrink-0 ${scrapeResult.ok ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' : 'bg-red-50 text-red-700 border-b border-red-100'}`}>
            {scrapeResult.ok ? `✓ Scraped ${scrapeResult.scraped} listings · ${scrapeResult.added} new added` : `Error: ${scrapeResult.error}`}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {(view === 'list' || view === 'split') && (
            <div className={`flex flex-col overflow-y-auto bg-slate-50 ${view === 'split' ? 'w-96 flex-shrink-0 border-r border-slate-200' : 'flex-1'}`}>
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                  <div>
                    <p className="text-4xl mb-2">🏠</p>
                    <p className="font-medium">No matches found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or click ↻ Refresh.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {paginated.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      selected={selectedId === p.id}
                      onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                      onStateChange={updateState}
                      onNoteChange={updateNote}
                      compact={view === 'split'}
                      parariusConnected={user?.integrations?.pararius?.status === 'connected'}
                    />
                  ))}

                  {/* Pagination & page size */}
                  {visible.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 pb-1 px-1">
                      {/* Page size selector */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Per page:</span>
                        <div className="flex gap-1">
                          {PAGE_SIZE_OPTIONS.map(n => (
                            <button
                              key={n}
                              onClick={() => handlePageSizeChange(n)}
                              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                                pageSize === n ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageSizeChange(0)}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                              pageSize === 0 ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            All
                          </button>
                        </div>
                      </div>
                      {/* Prev / next */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                          >
                            ← Prev
                          </button>
                          <span className="text-xs text-slate-500 font-medium">
                            Page {page} of {totalPages} · {visible.length} total
                          </span>
                          <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(view === 'map' || view === 'split') && (
            <div className="flex-1 relative">
              <MapView
                properties={mapProperties}
                selectedId={selectedId}
                onSelect={setSelectedId}
                parariusConnected={user?.integrations?.pararius?.status === 'connected'}
              />
              {/* Map count overlay */}
              {!loading && (
                <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-1.5 flex items-center gap-2 border border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span className="text-xs font-semibold text-slate-700">
                    {mapProperties.length} van {visible.length} matches op kaart
                  </span>
                  {visible.length - mapProperties.length > 0 && (
                    <span className="text-xs text-slate-400">
                      ({visible.length - mapProperties.length} zonder locatie)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ property: p, selected, onClick, onStateChange, onNoteChange, compact, parariusConnected }) {
  const stateStyle = STATE_COLORS[p.state] || STATE_COLORS.new;
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [applied, setApplied] = useState(!!p.appliedAt);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState(p.notes || '');
  const [noteSaving, setNoteSaving] = useState(false);

  const websiteName = p.url?.includes('pararius') ? 'Pararius' : (() => { try { return new URL(p.url).hostname.replace('www.', ''); } catch { return 'website'; } })();

  async function handleApply(e) {
    e.stopPropagation();
    if (applied) return;
    if (!parariusConnected) {
      alert('Please connect Pararius credentials in Integrations first.');
      return;
    }
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: p.id }),
      });
      const data = await res.json();
      if (data.success) {
        setApplied(true);
        setApplyResult('Applied!');
      } else {
        setApplyResult(data.error || 'Failed');
      }
    } catch {
      setApplyResult('Error');
    } finally {
      setApplying(false);
      if (!applied) setTimeout(() => setApplyResult(null), 4000);
    }
  }

  async function saveNote(e) {
    e.stopPropagation();
    setNoteSaving(true);
    await onNoteChange(p.id, noteText);
    setNoteSaving(false);
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border transition-all cursor-pointer ${
        selected ? 'border-blue-400 shadow-md' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="p-4">
        {/* Title & price */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-800 text-sm block truncate">{p.name}</span>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{p.neighborhood} · {p.zipCode}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-slate-800">€{p.price?.toLocaleString()}</div>
            <div className="text-xs text-slate-400">/mo</div>
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <span>📐 {p.surfaceArea}m²</span>
            <span>🛏 {p.bedrooms} bed</span>
            <span>🛋️ {p.furniture || '–'}</span>
          </div>
        )}

        {/* View / Apply / AI buttons */}
        <div className="mt-3 flex gap-1.5" onClick={e => e.stopPropagation()}>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            View on {websiteName}
          </a>
          <button
            onClick={handleApply}
            disabled={applying || applied}
            title={applied ? 'Already applied' : !parariusConnected ? 'Connect credentials in Integrations' : `Apply on ${websiteName}`}
            className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              applied ? 'bg-emerald-100 text-emerald-700 cursor-default' :
              parariusConnected ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {applied ? '✓ Applied' : applying ? 'Applying…' : applyResult || `Apply on ${websiteName}`}
          </button>
        </div>

        {/* State & actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stateStyle.bg} ${stateStyle.text}`}>
              {stateStyle.label}
            </span>
            {p.notes && (
              <span className="text-xs text-slate-400">📝</span>
            )}
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <ActionButton title="Add note" onClick={() => setShowNotes(v => !v)} active={showNotes}>📝</ActionButton>
            <ActionButton title="Mark interesting" onClick={() => onStateChange(p.id, 'interesting')} active={p.state === 'interesting'}>⭐</ActionButton>
            <ActionButton title="Shortlist" onClick={() => onStateChange(p.id, 'shortlisted')} active={p.state === 'shortlisted'}>❤️</ActionButton>
            <ActionButton title="Hide" onClick={() => onStateChange(p.id, 'hidden')} active={p.state === 'hidden'}>🗑</ActionButton>
            {(p.state === 'interesting' || p.state === 'shortlisted' || p.state === 'hidden') && (
              <ActionButton title="Move back to new" onClick={() => onStateChange(p.id, 'new')}>↩</ActionButton>
            )}
          </div>
        </div>

        {/* Notes section */}
        {showNotes && (
          <div className="mt-3 pt-3 border-t border-slate-50" onClick={e => e.stopPropagation()}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add your notes about this property…"
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <button
              onClick={saveNote}
              disabled={noteSaving}
              className="mt-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {noteSaving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ title, onClick, active, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
        active ? 'bg-slate-800' : 'bg-slate-100 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
