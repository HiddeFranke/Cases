'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

const NEIGHBORHOODS = [
  'Centrum', 'De Pijp', 'Oud-Zuid', 'Jordaan', 'Oost',
  'West', 'Noord', 'Nieuw-West', 'Buitenveldert', 'Watergraafsmeer',
  'IJburg', 'Zuidas', 'Westerpark',
];

const DEFAULT_FILTER = {
  name: 'New Filter',
  active: true,
  neighborhoods: [],
  minPrice: 0,
  maxPrice: 3000,
  minSurface: 0,
  bedrooms: 0,
  furniture: 'any',
};

function filterSummary(f) {
  const parts = [];
  if (f.minPrice || f.maxPrice < 9999) parts.push(`€${f.minPrice}–€${f.maxPrice}`);
  if (f.bedrooms > 0) parts.push(`${f.bedrooms}+ bed`);
  if (f.minSurface > 0) parts.push(`${f.minSurface}m²+`);
  if (f.furniture && f.furniture !== 'any') parts.push(f.furniture);
  if (f.neighborhoods?.length > 0) parts.push(`${f.neighborhoods.length} buurt${f.neighborhoods.length > 1 ? 'en' : ''}`);
  return parts.length ? parts.join(' · ') : 'All properties';
}

export default function FiltersPage() {
  const [filterSets, setFilterSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = list view, 'new' = new filter, uuid = edit existing
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        setFilterSets(d.user?.filterSets || []);
        setLoading(false);
      });
  }, []);

  function startNew() {
    setDraft({ ...DEFAULT_FILTER });
    setEditingId('new');
  }

  function startEdit(fs) {
    setDraft({ ...fs });
    setEditingId(fs.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveFilter() {
    setSaving(true);
    if (editingId === 'new') {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'filterSets.add', data: draft }),
      });
      const d = await res.json();
      setFilterSets(d.filterSets);
    } else {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'filterSets.update', data: { id: editingId, ...draft } }),
      });
      const d = await res.json();
      setFilterSets(d.filterSets);
    }
    setSaving(false);
    setEditingId(null);
    setDraft(null);
  }

  async function deleteFilter(id) {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'filterSets.remove', data: { id } }),
    });
    const d = await res.json();
    setFilterSets(d.filterSets);
  }

  async function toggleActive(fs) {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'filterSets.update', data: { id: fs.id, active: !fs.active } }),
    });
    const d = await res.json();
    setFilterSets(d.filterSets);
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading filters…</div>
      </main>
    </div>
  );

  // Edit / new filter view
  if (editingId !== null && draft) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-60 flex-1 p-8">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <button onClick={cancelEdit} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {editingId === 'new' ? 'New Filter' : 'Edit Filter'}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">Configure this search filter. Matches must satisfy ANY active filter.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Filter name */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Filter Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Budget Centrum"
                />
              </div>

              {/* Neighbourhoods */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span>📍</span> Neighbourhoods
                </h2>
                <div className="flex flex-wrap gap-2">
                  {NEIGHBORHOODS.map(n => (
                    <button
                      key={n}
                      onClick={() => setDraft(d => ({
                        ...d,
                        neighborhoods: d.neighborhoods.includes(n)
                          ? d.neighborhoods.filter(x => x !== n)
                          : [...d.neighborhoods, n],
                      }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        draft.neighborhoods.includes(n)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {draft.neighborhoods.length === 0 && (
                  <p className="text-xs text-slate-400 mt-2">None selected = show all neighbourhoods</p>
                )}
              </div>

              {/* Price range */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span>💶</span> Price Range (€/month)
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Minimum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                      <input
                        type="number" min={0} value={draft.minPrice}
                        onChange={e => setDraft(d => ({ ...d, minPrice: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Maximum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                      <input
                        type="number" min={draft.minPrice} value={draft.maxPrice}
                        onChange={e => setDraft(d => ({ ...d, maxPrice: parseInt(e.target.value) || 999999 }))}
                        className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Surface & Bedrooms */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span>📐</span> Size Requirements
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Min. Surface Area</label>
                    <div className="relative">
                      <input
                        type="number" min={0} value={draft.minSurface}
                        onChange={e => setDraft(d => ({ ...d, minSurface: parseInt(e.target.value) || 0 }))}
                        className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">m²</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Min. Bedrooms</label>
                    <select
                      value={draft.bedrooms}
                      onChange={e => setDraft(d => ({ ...d, bedrooms: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value={0}>Any</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Furnishing */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span>🛋️</span> Furnishing
                </h2>
                <div className="flex gap-3">
                  {[
                    { value: 'any', label: 'Any' },
                    { value: 'furnished', label: 'Furnished' },
                    { value: 'unfurnished', label: 'Unfurnished' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDraft(d => ({ ...d, furniture: opt.value }))}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                        draft.furniture === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={saveFilter}
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-colors"
                >
                  {saving ? 'Saving…' : editingId === 'new' ? 'Add Filter' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // List view
  const activeCount = filterSets.filter(f => f.active).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Search Filters</h1>
              <p className="text-slate-500 mt-1 text-sm">
                A property is a match if it passes <span className="font-semibold text-slate-700">any</span> active filter.
                {activeCount > 0 && (
                  <span className="ml-1 text-blue-600">{activeCount} active filter{activeCount > 1 ? 's' : ''}.</span>
                )}
              </p>
            </div>
            <button
              onClick={startNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              + Add Filter
            </button>
          </div>

          {/* Active filters summary bar */}
          {filterSets.length > 0 && (
            <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Active Filters</p>
              <div className="flex flex-wrap gap-2">
                {filterSets.filter(f => f.active).map(f => (
                  <span key={f.id} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 inline-block"></span>
                    {f.name}
                  </span>
                ))}
                {activeCount === 0 && (
                  <span className="text-sm text-blue-500">No active filters — all properties shown</span>
                )}
              </div>
            </div>
          )}

          {/* Filter set list */}
          {filterSets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-10 text-center shadow-sm">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-semibold text-slate-700">No filters yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Add a filter to start finding matching apartments.</p>
              <button onClick={startNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                + Add First Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filterSets.map(fs => (
                <div key={fs.id} className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${fs.active ? 'border-blue-200' : 'border-slate-100 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{fs.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fs.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {fs.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{filterSummary(fs)}</p>
                      {fs.neighborhoods?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {fs.neighborhoods.map(n => (
                            <span key={n} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{n}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(fs)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          fs.active
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {fs.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => startEdit(fs)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFilter(fs.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
