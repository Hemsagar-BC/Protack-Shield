const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Mock imports removed — dashboard starts clean until real data arrives

async function request(path, options = {}) {
  if (USE_MOCK) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] ${path} failed:`, err.message);
    return null;
  }
}

// ── Alerts ──────────────────────────────────────────────
export async function fetchAlerts(limit = 100) {
  const data = await request(`/alerts?limit=${limit}`);
  return data?.alerts ?? data ?? [];
}

export async function acknowledgeAlert(alertId) {
  const data = await request(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
  return data ?? { success: true, id: alertId };
}

export async function clearAlerts() {
  return await request('/alerts', { method: 'DELETE' });
}

// ── IP / Dropped Packets ────────────────────────────────
export async function fetchBlockedIPs() {
  const data = await request('/ip/blocked');
  return data?.blocked_ips ?? data ?? [];
}

export async function fetchThrottledIPs() {
  const data = await request('/ip/throttled');
  return data?.throttled_ips ?? data ?? [];
}

export async function fetchDroppedPackets() {
  const data = await request('/ip/dropped/stream');
  return data?.packets ?? data ?? [];
}

export async function fetchDroppedStats() {
  const data = await request('/ip/dropped/stats');
  return data ?? { sql_injection: 0, brute_force: 0, flooding: 0, xss: 0, blocked_ip: 0, rate_limit: 0 };
}

export async function blockIP(ip, reason = 'manual', severity = 'HIGH') {
  return await request('/ip/block', {
    method: 'POST',
    body: JSON.stringify({ ip, reason, severity }),
  });
}

export async function unblockIP(ip) {
  return await request('/ip/unblock', {
    method: 'POST',
    body: JSON.stringify({ ip }),
  });
}

export async function clearAllBlocks() {
  return await request('/ip/clear', { method: 'POST' });
}

// ── Response Engine ─────────────────────────────────────
export async function fetchResponseStatus() {
  const data = await request('/response/status');
  if (data) return data;

  // fallback: query response engine directly
  const re = await request('http://localhost:8004/status'.replace(API_BASE, ''));
  return re ?? { blocked_ips: [], throttled_ips: [], isolated_services: [] };
}

export async function executePlaybook(alertData) {
  return await request('/response/execute', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

export async function manualBlockIP(ip) {
  return await request('/response/block/' + ip, { method: 'POST' });
}

export async function manualUnblockIP(ip) {
  return await request('/response/block/' + ip, { method: 'DELETE' });
}

export async function isolateService(service) {
  return await request('/response/isolate/' + service, { method: 'POST' });
}

export async function restoreService(service) {
  return await request('/response/isolate/' + service, { method: 'DELETE' });
}

export async function throttleIP(ip) {
  return await request('/response/throttle/' + ip, { method: 'POST' });
}

export async function unthrottleIP(ip) {
  return await request('/response/throttle/' + ip, { method: 'DELETE' });
}

// ── Nodes / Fleet ───────────────────────────────────────
export async function fetchNodes() {
  const data = await request('/nodes');
  return data?.nodes ?? data ?? [];
}

export async function fetchDevices() {
  // Try ingest service nodes first
  const nodes = await fetchNodes();
  if (nodes && nodes.length > 0) return nodes;
  return [];
}

// ── Telemetry ───────────────────────────────────────────
export async function fetchEvents(limit = 50) {
  const data = await request(`/events?limit=${limit}`);
  return data?.events ?? data ?? [];
}

// ── Health ──────────────────────────────────────────────
export async function checkGatewayHealth() {
  const data = await request('/health');
  return data ?? { status: 'unknown' };
}
