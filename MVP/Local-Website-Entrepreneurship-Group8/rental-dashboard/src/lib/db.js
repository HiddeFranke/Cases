import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');
const USER_FILE = path.join(DATA_DIR, 'user.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ── Properties ──────────────────────────────────────────────────────────────

export function getProperties(state = 'all') {
  const data = readJson(PROPERTIES_FILE, { properties: [] });
  const props = data.properties || [];
  if (state === 'all') return props;
  if (state === 'visible') return props.filter(p => p.state !== 'hidden');
  return props.filter(p => p.state === state);
}

export function getProperty(id) {
  const data = readJson(PROPERTIES_FILE, { properties: [] });
  return (data.properties || []).find(p => p.id === id);
}

export function hasProperty(id) {
  // Match on full ID or short ID prefix (first 8 chars) to prevent duplicates
  const data = readJson(PROPERTIES_FILE, { properties: [] });
  const shortId = id.length > 8 ? id.substring(0, 8) : id;
  return (data.properties || []).some(p => p.id === id || p.id === shortId || p.id.startsWith(shortId + '-'));
}

export function addProperty(property) {
  if (!property?.id || hasProperty(property.id)) return false;
  const data = readJson(PROPERTIES_FILE, { properties: [] });
  data.properties = data.properties || [];
  data.properties.push({ ...property, state: 'new' });
  writeJson(PROPERTIES_FILE, data);
  return true;
}

export function updateProperty(id, updates) {
  const data = readJson(PROPERTIES_FILE, { properties: [] });
  const idx = (data.properties || []).findIndex(p => p.id === id);
  if (idx === -1) return false;
  data.properties[idx] = { ...data.properties[idx], ...updates };
  writeJson(PROPERTIES_FILE, data);
  return true;
}

export function getPropertiesWithoutCoordinates() {
  return getProperties('all').filter(p => !p.coordinates);
}

export function getStats() {
  const all = getProperties('all');
  return {
    total: all.length,
    newCount: all.filter(p => p.state === 'new').length,
    interesting: all.filter(p => p.state === 'interesting').length,
    shortlisted: all.filter(p => p.state === 'shortlisted').length,
    hidden: all.filter(p => p.state === 'hidden').length,
  };
}

// ── User / Settings ──────────────────────────────────────────────────────────

const DEFAULT_USER = {
  username: 'Hidde',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  // Pararius form fields (exact matches for auto-fill)
  salutation: '',           // Aanhef: 'Heer' | 'Mevrouw'
  dateOfBirth: '',          // Geboortedatum: 'YYYY-MM-DD'
  workSituation: '',        // Werksituatie (Pararius select)
  grossIncome: '',          // Totaal bruto inkomen (Pararius select)
  guarantor: '',            // Garantsteller (Pararius select)
  livingTogether: '',       // Ga je samenwonen? (Pararius select)
  numberOfTenants: '',      // Aantal huurders (shown when livingTogether != 'Nee')
  hasPets: false,           // Ik heb een of meerdere huisdieren (checkbox)
  desiredStartDate: '',     // Gewenste ingangsdatum van de huur: 'YYYY-MM-DD'
  desiredRentalPeriod: '',  // Gewenste huurperiode (Pararius select)
  currentLivingSituation: '',// Huidige woonsituatie (Pararius select)
  // Profile fields for AI letter generation
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
  subscription: 'Free Trial',
  filterSets: [],
  integrations: { pararius: { status: 'not_connected', encryptedAuthState: null, connectedAt: null } },
  defaultLetter: '',
  excludedSites: [],
  commuteAddress: '',
  playwrightHeadless: false,  // true = invisible browser, false = visible tab
};

export function getUser() {
  const user = readJson(USER_FILE, DEFAULT_USER);

  // Migrate old Pararius credentials → new connect-based format
  if (user.integrations?.pararius?.email && !user.integrations?.pararius?.status) {
    user.integrations.pararius = {
      status: 'not_connected',
      encryptedAuthState: null,
      connectedAt: user.integrations.pararius.lastSync || null,
    };
    writeJson(USER_FILE, user);
  }

  // Migrate old single filter → first filterSet
  if (!user.filterSets) {
    user.filterSets = [];
    if (user.filters && Object.keys(user.filters).length > 0) {
      user.filterSets.push({
        id: randomUUID(),
        name: 'My Filter',
        active: true,
        ...user.filters,
      });
    }
    delete user.filters;
    writeJson(USER_FILE, user);
  }

  return user;
}

export function updateUser(updates) {
  const current = getUser();
  const merged = { ...current, ...updates };
  writeJson(USER_FILE, merged);
  return merged;
}

// ── Filter Sets ──────────────────────────────────────────────────────────────

export function getFilterSets() {
  return getUser().filterSets || [];
}

export function addFilterSet(filterSet) {
  const user = getUser();
  const newSet = {
    id: randomUUID(),
    name: 'New Filter',
    active: true,
    neighborhoods: [],
    minPrice: 0,
    maxPrice: 3000,
    minSurface: 0,
    bedrooms: 0,
    furniture: 'any',
    ...filterSet,
  };
  user.filterSets = [...(user.filterSets || []), newSet];
  writeJson(USER_FILE, user);
  return newSet;
}

export function updateFilterSet(id, updates) {
  const user = getUser();
  const idx = (user.filterSets || []).findIndex(f => f.id === id);
  if (idx === -1) return false;
  user.filterSets[idx] = { ...user.filterSets[idx], ...updates };
  writeJson(USER_FILE, user);
  return user.filterSets[idx];
}

export function removeFilterSet(id) {
  const user = getUser();
  user.filterSets = (user.filterSets || []).filter(f => f.id !== id);
  writeJson(USER_FILE, user);
  return true;
}

export function updateIntegrations(integrations) {
  const user = getUser();
  user.integrations = { ...user.integrations, ...integrations };
  writeJson(USER_FILE, user);
  return user.integrations;
}

// Legacy compat
export function updateFilters(filters) {
  // No-op for legacy callers; filter sets handled separately
  return filters;
}

// ── Agent Jobs ──────────────────────────────────────────────────────────────

export function getAgentJobs() {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  return (data.jobs || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAgentJob(id) {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  return (data.jobs || []).find(j => j.id === id);
}

export function addAgentJob(job) {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  data.jobs = data.jobs || [];
  const newJob = {
    id: randomUUID(),
    type: 'apply',
    status: 'queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    usedAILetter: false,
    ...job,
  };
  data.jobs.push(newJob);
  writeJson(AGENTS_FILE, data);
  return newJob;
}

export function updateAgentJob(id, updates) {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  const idx = (data.jobs || []).findIndex(j => j.id === id);
  if (idx === -1) return false;
  data.jobs[idx] = { ...data.jobs[idx], ...updates };
  writeJson(AGENTS_FILE, data);
  return data.jobs[idx];
}

export function clearCompletedJobs() {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  const before = data.jobs.length;
  data.jobs = (data.jobs || []).filter(j => j.status === 'queued' || j.status === 'running');
  writeJson(AGENTS_FILE, data);
  return before - data.jobs.length;
}

export function removeAgentJob(id) {
  const data = readJson(AGENTS_FILE, { jobs: [] });
  data.jobs = (data.jobs || []).filter(j => j.id !== id);
  writeJson(AGENTS_FILE, data);
  return true;
}
