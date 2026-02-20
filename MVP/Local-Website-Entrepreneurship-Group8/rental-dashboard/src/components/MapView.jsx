'use client';

import { useEffect, useRef, useState } from 'react';

const AMSTERDAM_CENTER = { lat: 52.3676, lng: 4.9041 };
const MAPS_SCRIPT_ID = 'google-maps-script';
const MAP_ID = 'woonplek-map';

const STATE_COLORS = {
  new: '#2563eb',
  interesting: '#d97706',
  shortlisted: '#059669',
  hidden: '#94a3b8',
};

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.marker?.AdvancedMarkerElement) { resolve(); return; }
    if (document.getElementById(MAPS_SCRIPT_ID)) {
      const poll = setInterval(() => {
        if (window.google?.maps?.marker?.AdvancedMarkerElement) { clearInterval(poll); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=beta`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

function makeMarkerElement(p, isSelected) {
  const color = STATE_COLORS[p.state] || STATE_COLORS.new;
  const size = isSelected ? 20 : 14;
  const el = document.createElement('div');
  el.style.cssText = `
    width:${size}px; height:${size}px;
    border-radius:50%;
    background:${color};
    border:${isSelected ? 3 : 2}px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.35);
    cursor:pointer;
    transition:all .15s ease;
  `;
  return el;
}

function getWebsiteName(url) {
  if (!url) return 'website';
  if (url.includes('pararius')) return 'Pararius';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'website'; }
}

function infoWindowContent(p, parariusConnected) {
  const websiteName = getWebsiteName(p.url);
  const isApplied = !!p.appliedAt;
  const applyDisabled = isApplied || !parariusConnected;
  const applyStyle = isApplied
    ? 'background:#d1fae5;color:#047857;cursor:default;'
    : parariusConnected
      ? 'background:#2563eb;color:#fff;cursor:pointer;'
      : 'background:#f1f5f9;color:#94a3b8;cursor:not-allowed;';
  const applyTitle = isApplied
    ? 'Already applied'
    : parariusConnected
      ? `Apply on ${websiteName}`
      : 'Connect credentials in Integrations to apply';
  const applyLabel = isApplied ? '✓ Applied' : `Apply on ${websiteName}`;

  return `
    <div style="font-family:sans-serif;max-width:240px;padding:4px">
      <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:3px">${p.name}</div>
      <div style="font-size:12px;color:#475569;margin-bottom:5px">${p.neighborhood || ''} · ${p.zipCode || ''}</div>
      <div style="font-size:16px;font-weight:700;color:#2563eb;margin-bottom:5px">€${p.price?.toLocaleString() || '–'}/mo</div>
      <div style="font-size:11px;color:#64748b;margin-bottom:10px">
        ${p.surfaceArea ? p.surfaceArea + 'm²' : ''} ${p.bedrooms ? '· ' + p.bedrooms + ' bed' : ''} ${p.furniture ? '· ' + p.furniture : ''}
      </div>
      <div style="display:flex;gap:6px">
        <a href="${p.url}" target="_blank"
           style="flex:1;display:block;padding:7px 8px;background:#f1f5f9;color:#334155;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;text-align:center">
          View on ${websiteName} →
        </a>
        <button
          onclick="${isApplied ? '' : `window.__woonplekApply && window.__woonplekApply('${p.id}')`}"
          ${applyDisabled ? 'disabled' : ''}
          title="${applyTitle}"
          style="flex:1;padding:7px 8px;${applyStyle}border:none;border-radius:8px;font-size:12px;font-weight:600;text-align:center">
          ${applyLabel}
        </button>
      </div>
      ${!parariusConnected && !isApplied ? '<div style="font-size:10px;color:#94a3b8;margin-top:6px;text-align:center">Connect credentials in Integrations to apply</div>' : ''}
    </div>
  `;
}

export default function MapView({ properties, selectedId, onSelect, parariusConnected }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const infoWindowRef = useRef(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [applyStatus, setApplyStatus] = useState(null); // { id, status: 'loading'|'ok'|'error', message }

  // Register global apply handler for InfoWindow buttons
  useEffect(() => {
    window.__woonplekApply = async (propertyId) => {
      if (!parariusConnected) {
        alert('Please connect Pararius credentials in Integrations first.');
        return;
      }
      setApplyStatus({ id: propertyId, status: 'loading', message: 'Applying…' });
      try {
        const res = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        });
        const data = await res.json();
        if (data.success) {
          setApplyStatus({ id: propertyId, status: 'ok', message: 'Application sent!' });
        } else {
          setApplyStatus({ id: propertyId, status: 'error', message: data.error || 'Apply failed' });
        }
      } catch {
        setApplyStatus({ id: propertyId, status: 'error', message: 'Network error' });
      }
      setTimeout(() => setApplyStatus(null), 4000);
    };
    return () => { delete window.__woonplekApply; };
  }, [parariusConnected]);

  // Load Google Maps script
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) { setError('Google Maps API key not configured in .env.local'); return; }
    loadGoogleMapsScript(key)
      .then(() => setMapsLoaded(true))
      .catch(err => setError(err.message));
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: AMSTERDAM_CENTER,
      zoom: 12,
      mapId: MAP_ID,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [mapsLoaded]);

  // Sync markers (only when properties list changes, not on selection)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;
    const { AdvancedMarkerElement } = window.google.maps.marker;
    const map = mapInstanceRef.current;
    const existing = markersRef.current;

    // Remove stale markers
    const propIds = new Set(properties.map(p => p.id));
    for (const id of Object.keys(existing)) {
      if (!propIds.has(id)) { existing[id].map = null; delete existing[id]; }
    }

    properties.forEach(p => {
      if (!p.coordinates?.lat) return;

      if (existing[p.id]) return;

      const marker = new AdvancedMarkerElement({
        map,
        position: p.coordinates,
        title: p.name,
        content: makeMarkerElement(p, false),
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(infoWindowContent(p, parariusConnected));
        infoWindowRef.current?.open({ anchor: marker, map });
        onSelect?.(p.id);
      });

      existing[p.id] = marker;
    });

    markersRef.current = existing;
  }, [properties, mapsLoaded, onSelect, parariusConnected]);

  // Track previous selection to restore normal style
  const prevSelectedIdRef = useRef(null);

  // Pan to selected + open InfoWindow + update marker styles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const existing = markersRef.current;

    // Restore previous marker to normal style
    const prevId = prevSelectedIdRef.current;
    if (prevId && existing[prevId]) {
      const prevProp = properties.find(p => p.id === prevId);
      if (prevProp) {
        existing[prevId].content = makeMarkerElement(prevProp, false);
      }
    }

    if (!selectedId) {
      infoWindowRef.current?.close();
      prevSelectedIdRef.current = null;
      return;
    }

    const marker = existing[selectedId];
    const prop = properties.find(p => p.id === selectedId);
    if (marker && prop) {
      // Update marker to selected style
      marker.content = makeMarkerElement(prop, true);
      // Pan and zoom
      if (marker.position) {
        map.panTo(marker.position);
        map.setZoom(14);
      }
      // Open InfoWindow popup
      infoWindowRef.current?.setContent(infoWindowContent(prop, parariusConnected));
      infoWindowRef.current?.open({ anchor: marker, map });
    }

    prevSelectedIdRef.current = selectedId;
  }, [selectedId, properties, parariusConnected]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8 text-center">
        <div>
          <p className="text-4xl mb-2">🗺️</p>
          <p className="font-semibold text-slate-700">{error}</p>
          <p className="text-sm text-slate-400 mt-1">Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
        </div>
      </div>
    );
  }

  if (!mapsLoaded) {
    return (
      <div className="flex-1 bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {/* Apply status toast */}
      {applyStatus && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-10 ${
          applyStatus.status === 'loading' ? 'bg-blue-600 text-white' :
          applyStatus.status === 'ok' ? 'bg-emerald-600 text-white' :
          'bg-red-600 text-white'
        }`}>
          {applyStatus.message}
        </div>
      )}
    </div>
  );
}
