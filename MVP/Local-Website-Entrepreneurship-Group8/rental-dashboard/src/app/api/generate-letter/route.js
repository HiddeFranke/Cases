import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getProperty, getUser, updateUser } from '@/lib/db';

const LETTER_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function buildLetterPrompt(property, user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'de aanvrager';
  const email = user.integrations?.pararius?.email || user.email || '';

  return `Je bent een ervaren tekstschrijver die motivatiebrieven schrijft voor huurwoningen in Amsterdam en omgeving. Je schrijft brieven die warm, concreet en menselijk klinken — geen AI-achtige marketingtaal, geen clichés, geen overdreven enthousiasme.

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

Schrijf een motivatiebrief in het Nederlands voor deze huurwoning. Volg deze regels strikt:

### Onderzoek het adres
Gebruik je kennis over Amsterdam om 4 tot 7 concrete, locatiegerichte redenen te noemen waarom dit adres bij de aanvrager past. Denk aan:
- Fietsafstand of OV-verbinding naar werklocatie
- Nabijheid van stations, tram- of metrolijnen
- Parken of groen op loopafstand
- Dagelijkse voorzieningen (supermarkt, sportschool, horeca)
- Waarom de ligging past bij de levensstijl van de aanvrager

Noem alleen dingen die je redelijk zeker weet over deze locatie in Amsterdam. Geen overdreven of verzonnen claims.

### Structuur
1. **Onderwerpregel**: "Motivatie huurwoning [adres], [stad]"
2. **Aanhef**: "Geachte verhuurder," of "Beste [makelaar]," (als naam van de makelaar bekend is)
3. **Paragraaf 1 – Aanleiding en match**: Noem de woning en waarom je reageert. Koppel 2 tot 3 woningkenmerken aan persoonlijke wensen.
4. **Paragraaf 2 – Wie ik ben en betrouwbaarheid**: Korte introductie (werk, contract, huishouden). Benadruk stabiliteit en verzorgde woonstijl. Verwerk rook- en huisdierenstatus als dit positief of relevant is.
5. **Paragraaf 3 – Waarom deze woning**: 3 tot 5 specifieke pluspunten uit de woninggegevens. Laat zien dat je zorgvuldig huurt (netjes, respectvol, goede communicatie).
6. **Paragraaf 4 – Topografische motivatie**: 4 tot 7 concrete, locatiegerichte redenen waarom dit adres past. Maak het persoonlijk: hoe helpt deze locatie het dagelijks leven van de aanvrager.
7. **Paragraaf 5 – Praktisch en afronding**: Beschikbaarheid voor bezichtiging, gewenste startdatum, beschikbare documenten, vriendelijke afsluiting en uitnodiging tot contact.
8. **Slot**: "Met vriendelijke groet," gevolgd door naam en e-mailadres.

### Stijlregels
- Natuurlijk Nederlands, vriendelijk en professioneel
- Tussen 350 en 600 woorden
- Toon: betrouwbaar, warm, volwassen
- VERMIJD clichés zoals "met veel enthousiasme", "ik ben een echte teamplayer", "ik zou het fantastisch vinden", "deze woning spreekt mij enorm aan"
- Maak het concreet met 6 tot 10 details die echt bij deze woning en locatie horen
- Geen verzonnen feiten — als iets niet bekend is, formuleer neutraal of laat het weg
- Geen overbodige privé-informatie (geen BSN, geen exacte salarisbedragen tenzij opgegeven)
- Schrijf alsof het door een echt persoon is geschreven, niet door een AI
- GEEN markdown formatting, GEEN opsommingstekens, GEEN sterretjes of hekjes — alleen doorlopende tekst met alinea's
- Als bepaalde profielgegevens ontbreken, sla die onderdelen subtiel over zonder aandacht te vestigen op het ontbreken ervan
- Gebruik GEEN Engelse woorden tenzij het gangbare leenwoorden zijn

Lever ALLEEN de brief als doorlopende tekst. Geen uitleg, geen opmerkingen, geen intro.`;
}

function buildDefaultLetterPrompt(user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'de aanvrager';
  const email = user.integrations?.pararius?.email || user.email || '';

  return `Je bent een ervaren tekstschrijver die motivatiebrieven schrijft voor huurwoningen in Amsterdam en omgeving. Je schrijft brieven die warm, concreet en menselijk klinken — geen AI-achtige marketingtaal, geen clichés, geen overdreven enthousiasme.

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

Schrijf een herbruikbare standaard motivatiebrief (template) in het Nederlands voor huurwoningen. Deze brief wordt als standaardbrief gebruikt bij meerdere woningen, dus gebruik de volgende placeholders:
- Gebruik {{ADDRESS}} als placeholder voor het adres van de woning
- Gebruik {{NAME}} als placeholder voor de naam van de verhuurder/makelaar

De brief moet generiek genoeg zijn om voor verschillende woningen te werken, maar toch persoonlijk en concreet klinken op basis van het profiel van de aanvrager.

### Structuur
1. **Onderwerpregel**: "Motivatie huurwoning {{ADDRESS}}"
2. **Aanhef**: "Geachte {{NAME}},"
3. **Paragraaf 1 – Aanleiding**: Kort waarom je een woning zoekt in Amsterdam. Koppel dit aan persoonlijke situatie.
4. **Paragraaf 2 – Wie ik ben en betrouwbaarheid**: Korte introductie (werk, contract, huishouden). Benadruk stabiliteit en verzorgde woonstijl. Verwerk rook- en huisdierenstatus als dit positief of relevant is.
5. **Paragraaf 3 – Wat ik zoek in een woning**: Beschrijf woonwensen en levensstijl. Laat zien dat je een zorgvuldige huurder bent.
6. **Paragraaf 4 – Praktisch en afronding**: Beschikbaarheid voor bezichtiging, gewenste startdatum, beschikbare documenten, vriendelijke afsluiting en uitnodiging tot contact.
7. **Slot**: "Met vriendelijke groet," gevolgd door naam en e-mailadres.

### Stijlregels
- Natuurlijk Nederlands, vriendelijk en professioneel
- Tussen 250 en 450 woorden
- Toon: betrouwbaar, warm, volwassen
- VERMIJD clichés zoals "met veel enthousiasme", "ik ben een echte teamplayer", "ik zou het fantastisch vinden"
- Maak het concreet op basis van het persoonlijk profiel
- Geen verzonnen feiten
- Geen overbodige privé-informatie (geen BSN, geen exacte salarisbedragen tenzij opgegeven)
- Schrijf alsof het door een echt persoon is geschreven, niet door een AI
- GEEN markdown formatting, GEEN opsommingstekens, GEEN sterretjes of hekjes — alleen doorlopende tekst met alinea's
- Als bepaalde profielgegevens ontbreken, sla die onderdelen subtiel over
- Gebruik GEEN Engelse woorden tenzij het gangbare leenwoorden zijn
- Gebruik letterlijk {{ADDRESS}} en {{NAME}} als placeholders (niet vervangen door echte waarden)

Lever ALLEEN de brief als doorlopende tekst. Geen uitleg, geen opmerkingen, geen intro.`;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local. Add your key to enable AI letters.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { propertyId, type } = body;
  const isDefaultLetter = type === 'default';

  if (!isDefaultLetter && !propertyId) {
    return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
  }

  let property = null;
  if (!isDefaultLetter) {
    property = getProperty(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
  }

  const user = getUser();

  // Rate limit: 1 AI letter per hour
  const lastGenerated = user.lastLetterGeneratedAt || 0;
  const elapsed = Date.now() - lastGenerated;
  if (elapsed < LETTER_COOLDOWN_MS) {
    const retryAfter = Math.ceil((LETTER_COOLDOWN_MS - elapsed) / 1000);
    return NextResponse.json(
      { error: `Rate limited`, rateLimited: true, retryAfter },
      { status: 429 }
    );
  }
  const client = new Anthropic({ apiKey });

  const prompt = isDefaultLetter
    ? buildDefaultLetterPrompt(user)
    : buildLetterPrompt(property, user);

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    // Strip any markdown formatting the model might add
    const raw = message.content[0]?.text || '';
    const letter = raw.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').replace(/^#{1,3}\s+/gm, '').trim();
    updateUser({ lastLetterGeneratedAt: Date.now() });
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 });
  }
}
