'use strict';

// Adapted from pararius-apartment-hunting-dashboard/scraping-service.js
// Runs server-side only within Next.js API routes

import axios from 'axios';
import * as cheerio from 'cheerio';

const URL_REGEX = /^(https:\/\/)(www.)?(pararius\.com\/apartments)(\/(?!page)[a-zA-Z0-9\-]+)+(\/page-\d{0,2})?(\/?)/;
const MAX_RESULTS = 50;
const DELAY_MS = 300; // ~3 req/sec

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  await sleep(DELAY_MS);
  const resp = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
    },
    timeout: 15000,
  });
  return cheerio.load(resp.data);
}

function parseProperties($) {
  const results = [];
  $('li.search-list__item--listing').each((_, element) => {
    const section = $(element).find('section.listing-search-item');

    let id = section.find('form[data-listing-id]').attr('data-listing-id');
    if (!id) {
      const href = section.find('a.listing-search-item__link--title').attr('href') || '';
      id = href.split('/')[3] || undefined;
    }
    if (!id) return;

    const priceRaw = section.find('span.listing-search-item__price-main').text().trim();
    const price = parseInt(priceRaw.replace(/[€,]/g, '').replace(/\s*per month/i, '').trim()) || 0;

    const name = section.find('a.listing-search-item__link--title').text().replace(/\s\s+/g, ' ').trim();
    const urlHref = section.find('a.listing-search-item__link--title').attr('href') || '';
    const url = 'https://www.pararius.com' + urlHref.trim();

    const subTitle = section.find('div.listing-search-item__sub-title').text().trim();
    const zipMatch = subTitle.match(/^\d{4}\s[A-Z]{2}/);
    const zipCode = zipMatch ? zipMatch[0] : '';
    const neighborhoodMatch = subTitle.match(/\(([^)]+)\)/);
    const neighborhood = neighborhoodMatch ? neighborhoodMatch[1] : '';
    const city = subTitle.replace(zipCode, '').replace(neighborhood ? `(${neighborhood})` : '', '').replace(/,/g, '').trim();

    const agentName = section.find('div.listing-search-item__info > a.listing-search-item__link').text().replace(/\s\s+/g, ' ').trim();
    const agentUrl = section.find('div.listing-search-item__info > a.listing-search-item__link').attr('href') || '';

    const surfaceArea = parseInt(section.find('li.illustrated-features__item--surface-area').text().trim()) || 0;
    const totalRooms = parseInt(section.find('li.illustrated-features__item--number-of-rooms').text().trim()) || 0;
    const bedrooms = totalRooms > 1 ? totalRooms - 1 : totalRooms;
    const furniture = section.find('li.illustrated-features__item--interior').text().trim();

    results.push({
      id,
      price,
      name,
      url,
      zipCode,
      city,
      neighborhood,
      agentName,
      agentUrl,
      surfaceArea,
      bedrooms,
      furniture,
      availability: '',
      discoveryDate: new Date().toLocaleDateString('nl-NL'),
      locationUrl: `https://www.google.com/maps/place/${zipCode.replace(' ', '+')}+${city}`,
      state: 'new',
    });
  });
  return results;
}

export async function scrapePararius(baseUrl) {
  if (!URL_REGEX.test(baseUrl)) {
    throw new Error('Invalid Pararius URL');
  }

  // Normalize URL – strip existing /page- suffix
  let cleanUrl = baseUrl.match(URL_REGEX)[0];
  if (cleanUrl.includes('/page-')) {
    cleanUrl = cleanUrl.substring(0, cleanUrl.indexOf('/page-'));
  }

  const $ = await fetchPage(cleanUrl + '/page-1');
  const firstPage = parseProperties($);

  const countText = $('h1.search-list-header__heading').text().trim();
  const totalCount = Math.min(parseInt(countText) || firstPage.length, MAX_RESULTS);
  const totalPages = Math.ceil(totalCount / 30);

  const allProperties = [...firstPage];

  for (let i = 2; i <= totalPages; i++) {
    try {
      const $p = await fetchPage(`${cleanUrl}/page-${i}`);
      allProperties.push(...parseProperties($p));
      if (allProperties.length >= MAX_RESULTS) break;
    } catch (err) {
      console.error(`Error fetching page ${i}:`, err.message);
    }
  }

  return allProperties.slice(0, MAX_RESULTS);
}
