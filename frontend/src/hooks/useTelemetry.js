import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { mockTelemetry } from '../mock/data';

const MAX_POINTS = 120;
const MAX_RAW_EVENTS = 100;

export function useTelemetry() {
  const [devices, setDevices] = useState({});
  const [activeDevice, setActiveDevice] = useState(null);
  const [telemetryData, setTelemetryData] = useState({});
  const [rawEvents, setRawEvents] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [eventsPerMin, setEventsPerMin] = useState(0);
  const eventCountRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Count events per minute
  useEffect(() => {
    const interval = setInterval(() => {
      setEventsPerMin(eventCountRef.current);
      eventCountRef.current = 0;
    }, 60000);

    // Initial estimate
    const quickInterval = setInterval(() => {
      setEventsPerMin(prev => Math.max(prev, eventCountRef.current * 6));
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(quickInterval);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleTelemetry = (event) => {
      if (pausedRef.current) return;
      eventCountRef.current++;

      const deviceId = event.device_id || event.source_ip || 'unknown';
      const payload = event.payload || {};

      // Update device registry
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          id: deviceId,
          ip: event.source_ip,
          lastSeen: Date.now(),
          sector: event.domain || 'general',
          status: 'online',
        },
      }));

      // Set active device if none selected
      setActiveDevice(prev => prev || deviceId);

      // Buffer telemetry data per device
      const point = {
        timestamp: Date.now(),
        cpu: payload.cpu_percent ?? payload.cpu ?? Math.random() * 60 + 20,
        memory: payload.memory_percent ?? payload.memory ?? Math.random() * 30 + 50,
        network: (payload.network_bytes ?? payload.network_kb ?? Math.random() * 500) / 1024,
        disk: payload.disk_percent ?? payload.disk ?? 55,
      };

      setTelemetryData(prev => {
        const existing = prev[deviceId] || [];
        const updated = [...existing, point].slice(-MAX_POINTS);
        return { ...prev, [deviceId]: updated };
      });

      // Raw events log
      setRawEvents(prev => {
        const entry = {
          id: event.event_id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          data: event,
        };
        return [entry, ...prev].slice(0, MAX_RAW_EVENTS);
      });
    };

    socket.on('telemetry', handleTelemetry);

    // Load mock data as initial buffer
    if (!Object.keys(telemetryData).length) {
      setTelemetryData({ 'mock-node': mockTelemetry.map((p, i) => ({ ...p, timestamp: Date.now() - (60 - i) * 2000 })) });
      setActiveDevice('mock-node');
      setDevices({ 'mock-node': { id: 'mock-node', ip: '127.0.0.1', lastSeen: Date.now(), sector: 'general', status: 'online' } });
    }

    return () => {
      socket.off('telemetry', handleTelemetry);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePause = useCallback(() => setIsPaused(p => !p), []);

  const currentData = telemetryData[activeDevice] || [];

  return {
    devices,
    activeDevice,
    setActiveDevice,
    telemetryData: currentData,
    allTelemetryData: telemetryData,
    rawEvents,
    isPaused,
    togglePause,
    eventsPerMin,
  };
}
