import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

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

      // API gateway sends: { deviceId, deviceName, timestamp, metrics: { cpu, memory, network, ... } }
      // Systemapp sends via ingest: { source_ip, service, payload: { cpu, memory, ... } }
      const deviceId = event.deviceId || event.device_id || event.source_ip || 'unknown';
      const metrics = event.metrics || event.payload || {};

      // Update device registry
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          id: deviceId,
          name: event.deviceName || deviceId,
          ip: event.source_ip || event.deviceId,
          lastSeen: Date.now(),
          sector: metrics.sector || event.domain || 'general',
          status: 'online',
        },
      }));

      // Set active device if none selected
      setActiveDevice(prev => prev || deviceId);

      // Buffer telemetry data per device
      const point = {
        timestamp: Date.now(),
        cpu: metrics.cpu_percent ?? metrics.cpu ?? 0,
        memory: metrics.memory_percent ?? metrics.memory ?? 0,
        network: metrics.network_bytes != null ? metrics.network_bytes / 1024 : (metrics.network ?? 0),
        disk: metrics.disk_percent ?? metrics.disk ?? 0,
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

    // Dashboard starts empty — real data arrives via WebSocket

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
