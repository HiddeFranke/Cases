import { chromium } from 'playwright';

const VIEWPORT = { width: 900, height: 650 };
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const LOGIN_URL = 'https://www.pararius.com/login';

// Use globalThis to survive Next.js hot reloads in dev mode
const SESSION_KEY = '__parariusBrowserSession';

function getSession() {
  if (!globalThis[SESSION_KEY]) {
    globalThis[SESSION_KEY] = {
      browser: null,
      context: null,
      page: null,
      timeoutHandle: null,
      active: false,
      capturedEmail: null,
    };
  }
  return globalThis[SESSION_KEY];
}

function resetTimeout() {
  const s = getSession();
  if (s.timeoutHandle) clearTimeout(s.timeoutHandle);
  s.timeoutHandle = setTimeout(() => closeSession(), TIMEOUT_MS);
}

export async function startSession() {
  const s = getSession();
  if (s.active) await closeSession();

  s.browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  s.context = await s.browser.newContext({
    viewport: VIEWPORT,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'nl-NL',
  });

  s.page = await s.context.newPage();
  await s.page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await s.page.waitForTimeout(2000);

  // Auto-dismiss cookie banners
  await dismissCookies();

  s.active = true;
  resetTimeout();

  return await getScreenshot();
}

export async function getScreenshot() {
  const s = getSession();
  if (!s.page || !s.active) return null;

  const buffer = await s.page.screenshot({ type: 'jpeg', quality: 70 });
  const loginDetected = detectLogin();

  return {
    screenshot: buffer.toString('base64'),
    loginDetected,
    url: s.page.url(),
  };
}

export function detectLogin() {
  const s = getSession();
  if (!s.page) return false;
  const url = s.page.url();
  return (
    url.includes('pararius.com') &&
    !url.includes('/login') &&
    !url.includes('/inloggen')
  );
}

async function dismissCookies() {
  const s = getSession();
  if (!s.page) return;
  try {
    // Handle OneTrust overlay first
    const onetrust = s.page.locator('#onetrust-accept-btn-handler, .onetrust-close-btn-handler');
    if (await onetrust.isVisible({ timeout: 1500 }).catch(() => false)) {
      await onetrust.click();
      await s.page.waitForTimeout(800);
    }
    // Handle generic cookie consent buttons
    const btn = s.page.locator(
      'button:has-text("Accepteer"), button:has-text("Allow all"), button:has-text("Agree"), button:has-text("Akkoord"), button:has-text("Alles accepteren")'
    ).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click();
      await s.page.waitForTimeout(800);
    }
  } catch { /* ignore cookie errors */ }
}

export async function performAction({ type, x, y, text, key, selector }) {
  const s = getSession();
  if (!s.page || !s.active) throw new Error('No active session');
  resetTimeout();

  // Before performing the action, capture the email from the login form
  // (the user may have typed it and is now about to submit)
  await tryCaptureLoginEmail();

  switch (type) {
    case 'click':
      if (selector) {
        await s.page.locator(selector).first().click({ timeout: 5000 });
      } else {
        await s.page.mouse.click(x, y);
      }
      await s.page.waitForTimeout(300);
      break;
    case 'type':
      if (selector) {
        await s.page.locator(selector).first().fill(text);
      } else {
        await s.page.keyboard.type(text, { delay: 30 });
      }
      break;
    case 'press':
      await s.page.keyboard.press(key);
      await s.page.waitForTimeout(200);
      break;
    default:
      throw new Error(`Unknown action type: ${type}`);
  }

  await s.page.waitForTimeout(500);

  // After performing the action, try to capture the email again
  // (the user may have just finished typing it)
  await tryCaptureLoginEmail();

  return await getScreenshot();
}

async function tryCaptureLoginEmail() {
  const s = getSession();
  if (!s.page) return;
  try {
    const url = s.page.url();
    if (!url.includes('/login') && !url.includes('/inloggen')) return;
    const email = await s.page.evaluate(() => {
      const el = document.querySelector('input[type="email"], input[name="email"], input[name*="mail"], input[id*="mail"]');
      return el?.value || null;
    });
    if (email && email.includes('@')) {
      s.capturedEmail = email;
    }
  } catch { /* ignore */ }
}

export async function captureAuthState() {
  const s = getSession();
  if (!s.context || !s.active) throw new Error('No active session');
  return await s.context.storageState();
}

export function extractEmail() {
  const s = getSession();
  // Return the email captured from the login form during the login process
  return s.capturedEmail || null;
}

export async function closeSession() {
  const s = getSession();
  s.active = false;
  if (s.timeoutHandle) {
    clearTimeout(s.timeoutHandle);
    s.timeoutHandle = null;
  }
  try { if (s.page) await s.page.close(); } catch { /* ignore */ }
  try { if (s.context) await s.context.close(); } catch { /* ignore */ }
  try { if (s.browser) await s.browser.close(); } catch { /* ignore */ }
  s.page = null;
  s.context = null;
  s.browser = null;
}

export function isSessionActive() {
  return getSession().active;
}
