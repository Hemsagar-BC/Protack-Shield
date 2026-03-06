import { useState, useCallback, useRef, useEffect } from 'react';

const SCENARIOS = {
  normal: {
    name: 'Normal System',
    duration: 2000,
    description: 'Standard telemetry — CPU 45%, Mem 62%, Net 120KB/s',
    stages: [
      { telemetry: { cpu: 45, memory: 62, network: 120 }, duration: 2000 },
    ],
  },
  sqli: {
    name: 'SQL Injection',
    duration: 5000,
    description: 'DB metric spike + critical SQLi alert',
    stages: [
      { telemetry: { cpu: 55, memory: 70, network: 200 }, duration: 1500 },
      { telemetry: { cpu: 78, memory: 82, network: 450 }, duration: 1500 },
      {
        telemetry: { cpu: 92, memory: 88, network: 800 },
        alert: { title: 'SQL Injection Detected', severity: 'critical', rule_id: 'sql_injection', confidence: 0.95 },
        duration: 2000,
      },
    ],
  },
  flood: {
    name: 'Burst/Flood',
    duration: 8000,
    description: '300ms burst for 3s + DDoS alert at 2500 req/s',
    stages: [
      { telemetry: { cpu: 60, memory: 65, network: 300 }, duration: 1000 },
      { telemetry: { cpu: 75, memory: 72, network: 900 }, duration: 1500 },
      { telemetry: { cpu: 95, memory: 85, network: 2500 }, duration: 2000 },
      {
        telemetry: { cpu: 98, memory: 91, network: 3200 },
        alert: { title: 'DDoS Attack Detected', severity: 'critical', rule_id: 'rate_spike', confidence: 0.88 },
        duration: 1500,
      },
      { telemetry: { cpu: 55, memory: 63, network: 150 }, duration: 2000 },
    ],
  },
  replay: {
    name: 'Replay Incident',
    duration: 10000,
    description: '6-stage attack chain: recon → SSH → brute force → creds → lateral → exfiltration',
    stages: [
      { telemetry: { cpu: 48, memory: 60, network: 180 }, event: { type: 'network', message: 'Port scan detected from 10.0.0.42' }, duration: 1500 },
      { telemetry: { cpu: 52, memory: 62, network: 220 }, event: { type: 'auth', message: 'SSH connection attempt from 10.0.0.42' }, duration: 1500 },
      { telemetry: { cpu: 58, memory: 65, network: 280 }, event: { type: 'auth', message: 'Brute force — 15 failed logins in 30s' }, duration: 1500 },
      {
        telemetry: { cpu: 65, memory: 70, network: 350 },
        alert: { title: 'Brute Force Attack', severity: 'critical', rule_id: 'brute_force', confidence: 0.92 },
        event: { type: 'alert', message: 'Credentials compromised for admin' },
        duration: 2000,
      },
      { telemetry: { cpu: 72, memory: 78, network: 600 }, event: { type: 'action', message: 'Lateral movement to database server' }, duration: 1500 },
      {
        telemetry: { cpu: 88, memory: 85, network: 1200 },
        alert: { title: 'Data Exfiltration Detected', severity: 'critical', rule_id: 'high_network', confidence: 0.87 },
        event: { type: 'error', message: 'Large data transfer to external IP' },
        duration: 2000,
      },
    ],
  },
};

export function useScenarios(onTelemetry, onAlert, onTimelineEvent) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timeoutsRef = useRef([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  const runScenario = useCallback((scenarioKey) => {
    const scenario = SCENARIOS[scenarioKey];
    if (!scenario) return;

    clearTimeouts();
    setActiveScenario(scenarioKey);
    setIsRunning(true);
    setProgress(0);

    let elapsed = 0;
    const totalDuration = scenario.stages.reduce((sum, s) => sum + s.duration, 0);

    scenario.stages.forEach((stage, idx) => {
      const t = setTimeout(() => {
        if (stage.telemetry && onTelemetry) {
          onTelemetry(stage.telemetry);
        }
        if (stage.alert && onAlert) {
          onAlert({
            ...stage.alert,
            id: `scenario-${scenarioKey}-${idx}-${Date.now()}`,
            source: 'demo-scenario',
            acknowledged: false,
            created_at: new Date().toISOString(),
            evidence: { scenario: scenarioKey, stage: idx },
          });
        }
        if (stage.event && onTimelineEvent) {
          onTimelineEvent({
            ...stage.event,
            id: `tl-${scenarioKey}-${idx}-${Date.now()}`,
            timestamp: Date.now(),
          });
        }
        setProgress(Math.round(((idx + 1) / scenario.stages.length) * 100));
      }, elapsed);

      timeoutsRef.current.push(t);
      elapsed += stage.duration;
    });

    // Complete
    const done = setTimeout(() => {
      setIsRunning(false);
      setActiveScenario(null);
      setProgress(0);
    }, elapsed + 500);
    timeoutsRef.current.push(done);
  }, [clearTimeouts, onTelemetry, onAlert, onTimelineEvent]);

  const stopScenario = useCallback(() => {
    clearTimeouts();
    setIsRunning(false);
    setActiveScenario(null);
    setProgress(0);
  }, [clearTimeouts]);

  return {
    scenarios: SCENARIOS,
    activeScenario,
    isRunning,
    progress,
    runScenario,
    stopScenario,
  };
}
