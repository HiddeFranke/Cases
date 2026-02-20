import { NextResponse } from 'next/server';
import { getProperties, updateProperty, getStats } from '@/lib/db';

function matchesFilterSet(p, fs) {
  if (p.price < (fs.minPrice || 0)) return false;
  if (p.price > (fs.maxPrice || 999999)) return false;
  if ((fs.minSurface || 0) > 0 && p.surfaceArea < fs.minSurface) return false;
  if ((fs.bedrooms || 0) > 0 && p.bedrooms < fs.bedrooms) return false;
  if (fs.furniture && fs.furniture !== 'any') {
    const f = (p.furniture || '').toLowerCase();
    if (fs.furniture === 'furnished' && !f.includes('furnished')) return false;
    if (fs.furniture === 'unfurnished' && f.includes('furnished')) return false;
  }
  if (fs.neighborhoods?.length > 0) {
    const match = fs.neighborhoods.some(n =>
      p.neighborhood?.toLowerCase().includes(n.toLowerCase()) ||
      p.city?.toLowerCase().includes(n.toLowerCase())
    );
    if (!match) return false;
  }
  return true;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'visible';

  let properties = getProperties(state);

  // Multiple filter sets mode: pass filterSets as JSON string
  const filterSetsParam = searchParams.get('filterSets');
  if (filterSetsParam) {
    try {
      const filterSets = JSON.parse(filterSetsParam);
      const active = filterSets.filter(fs => fs.active !== false);
      if (active.length > 0) {
        properties = properties.filter(p => active.some(fs => matchesFilterSet(p, fs)));
      }
    } catch {
      // invalid JSON, ignore filter
    }
  } else {
    // Legacy single-filter mode
    const minPrice = parseInt(searchParams.get('minPrice')) || 0;
    const maxPrice = parseInt(searchParams.get('maxPrice')) || 999999;
    const minSurface = parseInt(searchParams.get('minSurface')) || 0;
    const bedrooms = parseInt(searchParams.get('bedrooms')) || 0;
    const furniture = searchParams.get('furniture') || 'any';
    const neighborhoods = searchParams.get('neighborhoods')
      ? searchParams.get('neighborhoods').split(',').filter(Boolean)
      : [];

    properties = properties.filter(p =>
      matchesFilterSet(p, { minPrice, maxPrice, minSurface, bedrooms, furniture, neighborhoods })
    );
  }

  return NextResponse.json({ properties, stats: getStats() });
}

export async function PATCH(request) {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const ok = updateProperty(id, updates);
  return NextResponse.json({ success: ok });
}
