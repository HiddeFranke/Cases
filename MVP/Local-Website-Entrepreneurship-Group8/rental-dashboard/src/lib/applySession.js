/**
 * Global store for the running apply automation browser page.
 * Allows the screenshot API to capture what the agent is doing.
 */

if (!globalThis.__applySession) {
  globalThis.__applySession = {
    page: null,
    jobId: null,
  };
}

const session = globalThis.__applySession;

export function setApplySession(page, jobId) {
  session.page = page;
  session.jobId = jobId;
}

export function clearApplySession() {
  session.page = null;
  session.jobId = null;
}

export async function getApplyScreenshot() {
  if (!session.page) return null;
  try {
    const buffer = await session.page.screenshot({ type: 'jpeg', quality: 70 });
    return {
      screenshot: buffer.toString('base64'),
      jobId: session.jobId,
      active: true,
    };
  } catch {
    return null;
  }
}

export function hasActiveSession() {
  return !!session.page;
}
