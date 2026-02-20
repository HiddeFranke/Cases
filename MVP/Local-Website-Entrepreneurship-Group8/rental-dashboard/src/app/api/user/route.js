import { NextResponse } from 'next/server';
import { getUser, updateUser, updateIntegrations, addFilterSet, updateFilterSet, removeFilterSet, getFilterSets } from '@/lib/db';

export async function GET() {
  const user = getUser();
  const safe = { ...user };
  // Never expose encrypted auth state in GET response
  if (safe.integrations?.pararius) {
    safe.integrations = {
      ...safe.integrations,
      pararius: {
        status: safe.integrations.pararius.status || 'not_connected',
        connectedAt: safe.integrations.pararius.connectedAt || null,
        email: safe.integrations.pararius.email || null,
      },
    };
  }
  return NextResponse.json({ user: safe });
}

export async function PATCH(request) {
  const body = await request.json();
  const { type, data } = body;

  if (type === 'filterSets.add') {
    const newSet = addFilterSet(data);
    return NextResponse.json({ filterSet: newSet, filterSets: getFilterSets() });
  }

  if (type === 'filterSets.update') {
    const { id, ...updates } = data;
    const updated = updateFilterSet(id, updates);
    return NextResponse.json({ filterSet: updated, filterSets: getFilterSets() });
  }

  if (type === 'filterSets.remove') {
    removeFilterSet(data.id);
    return NextResponse.json({ filterSets: getFilterSets() });
  }

  if (type === 'integrations') {
    const integrations = updateIntegrations(data);
    const safe = { ...integrations };
    if (safe.pararius) {
      safe.pararius = {
        status: safe.pararius.status || 'not_connected',
        connectedAt: safe.pararius.connectedAt || null,
      };
    }
    return NextResponse.json({ integrations: safe });
  }

  // General user update (letter, commuteAddress, etc.)
  const user = updateUser(data);
  return NextResponse.json({ user });
}
