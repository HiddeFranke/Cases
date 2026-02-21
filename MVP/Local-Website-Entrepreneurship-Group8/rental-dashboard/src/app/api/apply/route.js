import { NextResponse } from 'next/server';
import { getProperty, getUser, updateProperty, addAgentJob, updateAgentJob, updateIntegrations } from '@/lib/db';
import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { decrypt } from '@/lib/encryption';
import { setApplySession, clearApplySession } from '@/lib/applySession';

const APPLY_TIMEOUT = 60000;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ── AI letter generation ──────────────────────────────────────────────────────
async function generateAILetter(property, user) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'de aanvrager';
  const email = user.integrations?.pararius?.email || user.email || '';

  const prompt = `Je bent een ervaren tekstschrijver die motivatiebrieven schrijft voor huurwoningen in Amsterdam en omgeving. Je schrijft brieven die warm, concreet en menselijk klinken — geen AI-achtige marketingtaal, geen clichés.

## Woninggegevens
- Adres: ${property.name}
- Buurt: ${property.neighborhood || 'Amsterdam'}
- Postcode: ${property.zipCode || ''}
- Huurprijs: €${property.price}/maand
- Woonoppervlak: ${property.surfaceArea}m²
- Slaapkamers: ${property.bedrooms}
- Meubilering: ${property.furniture || 'niet gespecificeerd'}
- Makelaar/verhuurder: ${property.agentName || 'de verhuurder'}

## Persoonlijk profiel
- Naam: ${fullName}
- E-mail: ${email}
${user.ageCategory ? `- Leeftijdscategorie: ${user.ageCategory}` : ''}
${user.occupation ? `- Werk: ${user.occupation}` : ''}
${user.contractType ? `- Contracttype: ${user.contractType}` : ''}
${user.incomeDescription ? `- Inkomen: ${user.incomeDescription}` : ''}
${user.household ? `- Huishouden: ${user.household}` : ''}
${user.smoking ? `- Roken: ${user.smoking}` : ''}
${user.pets ? `- Huisdieren: ${user.pets}` : ''}
${user.moveReason ? `- Reden verhuizing: ${user.moveReason}` : ''}
${user.preferredStartDate ? `- Gewenste startdatum: ${user.preferredStartDate}` : ''}
${user.documentsAvailable ? `- Beschikbare documenten: ${user.documentsAvailable}` : ''}
${user.viewingAvailability ? `- Bezichtiging mogelijk: ${user.viewingAvailability}` : ''}

## Locatiecontext
${user.workLocation ? `- Werklocatie: ${user.workLocation}` : ''}
${user.transportMode ? `- Reiswijze: ${user.transportMode}` : ''}
${user.importantPlaces ? `- Belangrijke plekken: ${user.importantPlaces}` : ''}
${user.neighborhoodPrefs ? `- Buurtvoorkeuren: ${user.neighborhoodPrefs}` : ''}
${user.personalNote ? `\n## Persoonlijke noot\n${user.personalNote}` : ''}
${user.housingPrefs ? `\nWoonwensen: ${user.housingPrefs}` : ''}

## Opdracht

Schrijf een motivatiebrief in het Nederlands voor deze huurwoning.

### Onderzoek het adres
Gebruik je kennis over Amsterdam om 4 tot 7 concrete, locatiegerichte redenen te noemen waarom dit adres bij de aanvrager past (fietsafstand naar werk, OV, parken, voorzieningen, buurtkarakter). Noem alleen dingen die je redelijk zeker weet.

### Structuur
1. Onderwerpregel: "Motivatie huurwoning [adres], [stad]"
2. Aanhef: "Geachte verhuurder," of "Beste [makelaar],"
3. Paragraaf 1 – Aanleiding: noem de woning, koppel 2-3 kenmerken aan persoonlijke wensen
4. Paragraaf 2 – Wie ik ben: werk, contract, huishouden, stabiliteit
5. Paragraaf 3 – Waarom deze woning: 3-5 specifieke pluspunten
6. Paragraaf 4 – Topografische motivatie: 4-7 locatiegerichte redenen
7. Paragraaf 5 – Praktisch: bezichtiging, startdatum, documenten, afsluiting
8. Slot: "Met vriendelijke groet," + naam + e-mail

### Stijl
- Natuurlijk Nederlands, 350-600 woorden, betrouwbaar en warm
- VERMIJD clichés en AI-achtige taal
- GEEN markdown, GEEN bullets — alleen doorlopende tekst met alinea's
- Sla ontbrekende profielgegevens subtiel over
- Lever ALLEEN de brief, geen uitleg`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = message.content[0]?.text?.trim() || null;
    if (!raw) return null;
    return raw.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').replace(/^#{1,3}\s+/gm, '').trim();
  } catch {
    return null;
  }
}

// ── Find the correct Pararius contact URL from the property page ──────────────
// Uses a 3-layer strategy so we always get the right full UUID.
async function resolveContactUrl(page, property) {
  await page.goto(property.url, {
    waitUntil: 'domcontentloaded',
    timeout: APPLY_TIMEOUT,
  });
  await page.waitForTimeout(2000);

  // Layer 1 – extract href directly from "Contact the agent" link
  const contactHref = await page.evaluate(() => {
    const el = document.querySelector('a[href^="/contact/"]');
    return el ? el.getAttribute('href') : null;
  });
  if (contactHref) {
    console.log('[apply] Contact URL from link:', contactHref);
    return `https://www.pararius.com${contactHref}`;
  }

  // Layer 2 – scan ALL anchor hrefs for a UUID matching the /contact/ pattern
  const uuidFromLinks = await page.evaluate((uuidPattern) => {
    const re = new RegExp(uuidPattern, 'i');
    for (const a of document.querySelectorAll('a[href]')) {
      const m = a.href.match(re);
      if (m) return m[0];
    }
    // Also scan the full page HTML for any /contact/{uuid} occurrence
    const bodyMatch = document.body.innerHTML.match(re);
    return bodyMatch ? bodyMatch[0] : null;
  }, '/contact/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})');

  if (uuidFromLinks) {
    // uuidFromLinks may be the full path or just the UUID — normalise
    const uuidMatch = uuidFromLinks.match(UUID_RE);
    if (uuidMatch) {
      console.log('[apply] Contact UUID from page scan:', uuidMatch[0]);
      return `https://www.pararius.com/contact/${uuidMatch[0]}`;
    }
  }

  // Layer 3 – derive UUID from the property URL slug (first 8 chars) + look for
  //           matching full UUID anywhere in the page source (images, scripts, …)
  const urlSlug = property.url.match(/\/([0-9a-f]{8})\//)?.[1];
  if (urlSlug) {
    const fullUuid = await page.evaluate((slug) => {
      const re = new RegExp(slug + '-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'i');
      const match = document.documentElement.innerHTML.match(re);
      return match ? match[0] : null;
    }, urlSlug);
    if (fullUuid) {
      console.log('[apply] Full UUID extracted from page source:', fullUuid);
      return `https://www.pararius.com/contact/${fullUuid}`;
    }
  }

  // Layer 4 – last resort: use whatever ID we have stored (might already be correct)
  console.log('[apply] Falling back to stored property.id:', property.id);
  return `https://www.pararius.com/contact/${property.id}`;
}

// ── Pararius apply automation ─────────────────────────────────────────────────
// aiLetterPromise can be a Promise so that letter generation runs in parallel
// with browser startup and navigation.
async function applyOnPararius(property, user, aiLetterPromise, jobId) {
  const pararius = user?.integrations?.pararius || {};
  const phone = user.phone || '';

  if (!pararius.encryptedAuthState) {
    throw new Error('No Pararius auth state. Please connect via Integrations.');
  }

  // Decrypt the stored storageState
  let storageState;
  try {
    storageState = decrypt(pararius.encryptedAuthState);
  } catch {
    updateIntegrations({
      pararius: { ...pararius, status: 'needs_reconnect' },
    });
    throw new Error('Auth state decryption failed. Please reconnect Pararius.');
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Create context with stored storageState (cookies + localStorage)
  const context = await browser.newContext({
    storageState,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'nl-NL',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Store page reference for live screenshot API
  setApplySession(page, jobId);

  try {
    // ── Helper: dismiss cookie banner ─────────────────────────────────────────
    async function dismissCookies() {
      const btn = page.locator(
        'button:has-text("Accepteer"), button:has-text("Allow all"), button:has-text("Akkoord"), button:has-text("Alles accepteren")'
      ).first();
      if (await btn.isVisible({ timeout: 2500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    }

    // ── Step 1: Resolve the correct contact URL from the property page ────────
    await dismissCookies();
    const contactUrl = await resolveContactUrl(page, property);

    // ── Step 2: Navigate to the contact/apply form ────────────────────────────
    await page.goto(contactUrl, {
      waitUntil: 'domcontentloaded',
      timeout: APPLY_TIMEOUT,
    });
    await page.waitForTimeout(2000);
    await dismissCookies();

    // If redirected to login, the session has expired
    if (page.url().includes('/login') || page.url().includes('/inloggen')) {
      clearApplySession();
      await browser.close();
      updateIntegrations({
        pararius: { ...pararius, status: 'needs_reconnect' },
      });
      return {
        success: false,
        error: 'Pararius-sessie verlopen. Ga naar Integrations om opnieuw te verbinden.',
        needsReconnect: true,
      };
    }

    // Verify we're on the contact form page
    const currentUrl = page.url();
    if (!currentUrl.includes('/contact/')) {
      return {
        success: false,
        error: `Could not reach the contact form. Ended up at: ${currentUrl}`,
      };
    }

    // ── Pararius form field name prefix ───────────────────────────────────────
    const F = 'contact_agent_huurprofiel_form';

    // ── Helper: select <option> by visible text in a <select> found by name ──
    async function selectField(fieldName, value) {
      if (!value) return;
      try {
        const sel = page.locator(`select[name="${F}[${fieldName}]"]`);
        if (await sel.isVisible({ timeout: 2000 }).catch(() => false)) {
          const options = await sel.locator('option').allTextContents();
          const match = options.find(o => o.trim() === value)
            || options.find(o => o.trim().toLowerCase().includes(value.toLowerCase()))
            || options.find(o => value.toLowerCase().includes(o.trim().toLowerCase()));
          if (match) {
            await sel.selectOption({ label: match.trim() });
            console.log(`[apply] Selected "${match.trim()}" for ${fieldName}`);
          } else {
            console.log(`[apply] No match for ${fieldName}="${value}". Options: ${options.join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`[apply] selectField(${fieldName}) error: ${err.message}`);
      }
    }

    // ── Helper: fill text/date input by name ──────────────────────────────────
    async function fillField(fieldName, value, overwrite = false) {
      if (!value) return;
      try {
        const field = page.locator(`input[name="${F}[${fieldName}]"]`);
        if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
          const currentVal = await field.inputValue().catch(() => '');
          if (!currentVal || overwrite) {
            await field.fill(value);
            console.log(`[apply] Filled ${fieldName} with "${value}"`);
          } else {
            console.log(`[apply] ${fieldName} already has value: "${currentVal}"`);
          }
        }
      } catch (err) {
        console.log(`[apply] fillField(${fieldName}) error: ${err.message}`);
      }
    }

    // ── Step 3: Fill the motivation textarea ──────────────────────────────────
    // Await AI letter (generated in parallel with browser startup + navigation)
    const aiLetter = await aiLetterPromise;
    const formMessage = aiLetter
      || (user.defaultLetter
        ? user.defaultLetter
            .replace(/\{\{NAME\}\}/g, user.username || 'Applicant')
            .replace(/\{\{ADDRESS\}\}/g, property.name || property.url)
            .replace(/\{\{AGE\}\}/g, user.age || '')
            .replace(/\{\{OCCUPATION\}\}/g, user.occupation || '')
        : `Dear ${property.agentName || 'landlord'},\n\nMy name is ${user.username || 'Applicant'} and I am very interested in the apartment at ${property.name}. I am a reliable tenant with a stable income and would love to schedule a viewing at your convenience.\n\nKind regards,\n${user.username || 'Applicant'}`);

    const motivationField = page.locator(`textarea[name="${F}[motivation]"]`);
    if (await motivationField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await motivationField.click();
      await motivationField.fill(formMessage);
    }

    // ── Step 4: Fill "Mijn gegevens" section ─────────────────────────────────
    await selectField('salutation', user.salutation);
    await fillField('first_name', user.firstName);
    await fillField('last_name', user.lastName);
    await fillField('phone_number', phone);
    await fillField('date_of_birth', user.dateOfBirth);   // type=date, YYYY-MM-DD

    // ── Step 5: Fill "Huurprofiel" section ───────────────────────────────────
    await selectField('work_situation', user.workSituation);
    await selectField('gross_annual_household_income', user.grossIncome);
    await selectField('guarantor', user.guarantor);
    await selectField('preferred_living_situation', user.livingTogether);

    // Aantal huurders (only visible when samenwonen != Nee)
    if (user.numberOfTenants && user.livingTogether && user.livingTogether !== 'Nee') {
      await fillField('number_of_tenants', String(user.numberOfTenants));
    }

    // Huisdieren checkbox
    if (user.hasPets) {
      try {
        const petCheckbox = page.locator(`input[name="${F}[pets]"]`);
        if (await petCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          const isChecked = await petCheckbox.isChecked().catch(() => false);
          if (!isChecked) {
            await petCheckbox.check();
            console.log('[apply] Checked pets checkbox');
          }
        }
      } catch (err) {
        console.log(`[apply] Could not check pets: ${err.message}`);
      }
    }

    // Gewenste ingangsdatum
    await fillField('rent_start_date', user.desiredStartDate);  // type=date, YYYY-MM-DD

    // Gewenste huurperiode
    await selectField('preferred_contract_period', user.desiredRentalPeriod);

    // Huidige woonsituatie
    await selectField('current_housing_situation', user.currentLivingSituation);

    // ── Step 6: Submit ────────────────────────────────────────────────────────
    await page.waitForTimeout(800);

    const sendBtn = page.locator(
      'button:has-text("Versturen"), button:has-text("Verstuur"), button:has-text("Verzenden"), button:has-text("Send"), button[type="submit"]'
    ).first();

    if (await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(7000);
      clearApplySession();
      await browser.close();
      return { success: true, message: 'Application submitted via Pararius', contactUrl };
    }

    await page.waitForTimeout(8000);
    clearApplySession();
    await browser.close();
    return {
      success: false,
      error: 'Contact form found but could not locate the Send button.',
      contactUrl,
    };
  } catch (err) {
    clearApplySession();
    try { await browser.close(); } catch { /* ignore */ }
    throw err;
  }
}

// ── API Route ─────────────────────────────────────────────────────────────────

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { propertyId } = body;

  if (!propertyId) {
    return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
  }

  const property = getProperty(propertyId);
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const user = getUser();
  const pararius = user?.integrations?.pararius;

  if (pararius?.status !== 'connected' || !pararius?.encryptedAuthState) {
    return NextResponse.json(
      { error: 'Pararius niet verbonden. Ga naar Integrations om te verbinden.' },
      { status: 400 }
    );
  }

  // Create agent job to track this apply
  const job = addAgentJob({
    propertyId,
    propertyName: property.name || 'Unknown',
    propertyUrl: property.url || '',
    type: 'apply',
  });

  try {
    updateAgentJob(job.id, { status: 'running', startedAt: new Date().toISOString() });

    // Start AI letter generation in parallel with browser startup
    const aiLetterPromise = generateAILetter(property, user);
    const result = await applyOnPararius(property, user, aiLetterPromise, job.id);
    const aiLetter = await aiLetterPromise.catch(() => null);

    if (result.success) {
      updateProperty(propertyId, {
        state: 'shortlisted',
        appliedAt: new Date().toISOString(),
      });
      updateAgentJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: result.message || 'Application submitted',
        usedAILetter: !!aiLetter,
      });
    } else {
      updateAgentJob(job.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: result.error || 'Apply failed',
        usedAILetter: !!aiLetter,
      });
    }

    return NextResponse.json({ ...result, usedAILetter: !!aiLetter, jobId: job.id });
  } catch (err) {
    console.error('Apply error:', err);
    updateAgentJob(job.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: err.message || 'Apply failed',
    });
    return NextResponse.json({ error: err.message || 'Apply failed', jobId: job.id }, { status: 500 });
  }
}
