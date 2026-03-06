// Mock data for offline/demo mode

export const mockDevices = [
  { id: 'patient-monitor-1', name: 'Patient Monitor 1', sector: 'healthcare', status: 'online', health: 92, ip: '192.168.1.10' },
  { id: 'patient-monitor-2', name: 'Patient Monitor 2', sector: 'healthcare', status: 'online', health: 88, ip: '192.168.1.11' },
  { id: 'med-pump-1', name: 'Med Pump 1', sector: 'healthcare', status: 'online', health: 95, ip: '192.168.1.12' },
  { id: 'soil-sensor-1', name: 'Soil Sensor 1', sector: 'agriculture', status: 'online', health: 78, ip: '192.168.2.10' },
  { id: 'soil-sensor-2', name: 'Soil Sensor 2', sector: 'agriculture', status: 'warning', health: 55, ip: '192.168.2.11' },
  { id: 'weather-station', name: 'Weather Station', sector: 'agriculture', status: 'online', health: 90, ip: '192.168.2.12' },
  { id: 'traffic-cam-1', name: 'Traffic Cam 1', sector: 'urban', status: 'online', health: 97, ip: '192.168.3.10' },
  { id: 'smart-light-1', name: 'Smart Light 1', sector: 'urban', status: 'offline', health: 0, ip: '192.168.3.11' },
];

export const mockAlerts = [
  {
    id: 'alert-001',
    title: 'SQL Injection Detected',
    severity: 'critical',
    source: '192.168.1.100',
    rule_id: 'sql_injection',
    confidence: 0.95,
    acknowledged: false,
    created_at: new Date(Date.now() - 120000).toISOString(),
    evidence: {
      payload: "' OR 1=1 --",
      attacker_ip: '10.0.0.55',
      endpoint: '/data',
      method: 'POST',
    },
  },
  {
    id: 'alert-002',
    title: 'Brute Force Attack',
    severity: 'critical',
    source: '192.168.1.100',
    rule_id: 'brute_force',
    confidence: 0.9,
    acknowledged: false,
    created_at: new Date(Date.now() - 60000).toISOString(),
    evidence: {
      failed_attempts: 12,
      attacker_ip: '10.0.0.77',
      endpoint: '/login',
      window: '60s',
    },
  },
  {
    id: 'alert-003',
    title: 'High CPU Usage',
    severity: 'warning',
    source: 'node-alpha',
    rule_id: 'high_cpu',
    confidence: 0.95,
    acknowledged: true,
    created_at: new Date(Date.now() - 300000).toISOString(),
    evidence: { cpu_percent: 91, threshold: 85 },
  },
  {
    id: 'alert-004',
    title: 'ML: Network DDoS Detected',
    severity: 'critical',
    source: '192.168.1.100',
    rule_id: 'ml_network_shield',
    confidence: 0.87,
    acknowledged: false,
    created_at: new Date(Date.now() - 30000).toISOString(),
    evidence: {
      ml_score: 0.87,
      model: 'network_shield',
      attacker_ip: '10.0.0.99',
    },
  },
  {
    id: 'alert-005',
    title: 'Rate Spike Detected',
    severity: 'warning',
    source: '192.168.1.100',
    rule_id: 'rate_spike',
    confidence: 0.75,
    acknowledged: false,
    created_at: new Date(Date.now() - 15000).toISOString(),
    evidence: { requests_per_minute: 620, threshold: 500 },
  },
];

export const mockPlaybooks = [
  { id: 'pb-block-ip', name: 'Block Attacker IP', actions: ['BLOCK_IP', 'ALERT_ONLY'] },
  { id: 'pb-isolate', name: 'Isolate Service', actions: ['ISOLATE_SERVICE', 'ALERT_ONLY'] },
  { id: 'pb-throttle', name: 'Throttle Traffic', actions: ['THROTTLE'] },
  { id: 'pb-full-response', name: 'Full Response', actions: ['BLOCK_IP', 'ISOLATE_SERVICE', 'THROTTLE', 'ALERT_ONLY'] },
];

function generateTelemetryPoint(i, base) {
  const t = Date.now() - (60 - i) * 2000;
  return {
    timestamp: t,
    cpu: Math.min(100, Math.max(0, base.cpu + (Math.random() - 0.5) * 10)),
    memory: Math.min(100, Math.max(0, base.memory + (Math.random() - 0.5) * 5)),
    network: Math.max(0, base.network + (Math.random() - 0.5) * 80),
    disk: Math.min(100, Math.max(0, base.disk + (Math.random() - 0.5) * 2)),
  };
}

export const mockTelemetry = Array.from({ length: 61 }, (_, i) =>
  generateTelemetryPoint(i, { cpu: 45, memory: 62, network: 120, disk: 55 })
);

export const mockDroppedPackets = [
  { ip: '10.0.0.55', attack_type: 'sql_injection', endpoint: '/data', reason: 'SQLi pattern detected', timestamp: new Date(Date.now() - 5000).toISOString() },
  { ip: '10.0.0.77', attack_type: 'brute_force', endpoint: '/login', reason: '5+ failed auth in 60s', timestamp: new Date(Date.now() - 10000).toISOString() },
  { ip: '10.0.0.99', attack_type: 'flooding', endpoint: '/', reason: '>100 req/10s', timestamp: new Date(Date.now() - 15000).toISOString() },
  { ip: '10.0.0.33', attack_type: 'xss', endpoint: '/api/search', reason: '<script> tag detected', timestamp: new Date(Date.now() - 20000).toISOString() },
  { ip: '10.0.0.55', attack_type: 'blocked_ip', endpoint: '/data', reason: 'Previously blocked IP', timestamp: new Date(Date.now() - 25000).toISOString() },
];

export const mockResponseStatus = {
  blocked_ips: ['10.0.0.55', '10.0.0.77', '10.0.0.99'],
  throttled_ips: ['10.0.0.33', '10.0.0.44'],
  isolated_services: ['patient-monitor-2'],
};

export const mockTimelineEvents = [
  { id: 't1', type: 'auth', message: 'Failed login from 10.0.0.77', timestamp: Date.now() - 60000 },
  { id: 't2', type: 'network', message: 'Traffic spike detected (2500 req/s)', timestamp: Date.now() - 55000 },
  { id: 't3', type: 'alert', message: 'SQL Injection alert triggered', timestamp: Date.now() - 50000 },
  { id: 't4', type: 'action', message: 'IP 10.0.0.55 blocked automatically', timestamp: Date.now() - 45000 },
  { id: 't5', type: 'device', message: 'patient-monitor-2 health dropped to 55%', timestamp: Date.now() - 40000 },
  { id: 't6', type: 'error', message: 'Connection to node-beta lost', timestamp: Date.now() - 35000 },
  { id: 't7', type: 'auth', message: 'Brute force detected from 10.0.0.77', timestamp: Date.now() - 30000 },
  { id: 't8', type: 'action', message: 'Playbook executed: Block + Throttle', timestamp: Date.now() - 25000 },
  { id: 't9', type: 'network', message: 'DDoS mitigated — traffic normalized', timestamp: Date.now() - 20000 },
  { id: 't10', type: 'device', message: 'smart-light-1 went offline', timestamp: Date.now() - 15000 },
];
