import { NextResponse } from 'next/server';
import { scrapePararius } from '@/lib/scraper';
import { addProperty, getProperties, getPropertiesWithoutCoordinates, updateProperty } from '@/lib/db';

let scrapeInProgress = false;

async function geocodeProperties() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return;

  const ungeocoded = getPropertiesWithoutCoordinates();
  for (const p of ungeocoded) {
    if (!p.zipCode) continue;
    try {
      const query = encodeURIComponent(`${p.zipCode} ${p.city} Netherlands`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&region=NL&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        updateProperty(p.id, { coordinates: { lat: loc.lat, lng: loc.lng } });
      }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.error(`Geocode error for ${p.id}:`, err.message);
    }
  }
}

export async function POST(request) {
  if (scrapeInProgress) {
    return NextResponse.json({ error: 'Scrape already running' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const url = body.url || 'https://www.pararius.com/apartments/amsterdam/';

  scrapeInProgress = true;
  try {
    const properties = await scrapePararius(url);
    let added = 0;
    for (const prop of properties) {
      if (addProperty(prop)) added++;
    }

    // Geocode all properties without coordinates in background
    geocodeProperties().catch(err => console.error('Geocode background error:', err));

    return NextResponse.json({ success: true, scraped: properties.length, added });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    scrapeInProgress = false;
  }
}

export async function GET() {
  return NextResponse.json({
    isRunning: scrapeInProgress,
    totalStored: getProperties('all').length,
  });
}
