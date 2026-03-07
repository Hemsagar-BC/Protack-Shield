import { io } from 'socket.io-client';
import { mockTelemetry, mockAlerts, mockDroppedPackets } from '../mock/data';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

let socket = null;
let mockInterval = null;

export function getSocket() {
  if (socket) return socket;

  if (USE_MOCK) {
    return createMockSocket();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  // Heartbeat
  setInterval(() => {
    if (socket.connected) {
      socket.emit('ping');
    }
  }, 30000);

  return socket;
}

export function disconnectSocket() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Mock Socket for offline mode ────────────────────────
function createMockSocket() {
  const listeners = {};
  let mockIdx = 0;

  const mockSocket = {
    id: 'mock-socket',
    connected: true,

    on(event, cb) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      if (event === 'connect') setTimeout(() => cb(), 100);
    },

    off(event, cb) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(fn => fn !== cb);
      }
    },

    emit(event, data) {
      // noop for mock
    },

    disconnect() {
      const cbs = listeners['disconnect'] || [];
      cbs.forEach(cb => cb('manual'));
    },
  };

  function emit(event, data) {
    (listeners[event] || []).forEach(cb => cb(data));
  }

  // Emit mock telemetry every 2s
  mockInterval = setInterval(() => {
    const point = mockTelemetry[mockIdx % mockTelemetry.length];
    const telemetry = {
      ...point,
      timestamp: new Date().toISOString(),
      source_ip: '192.168.1.100',
      device_id: 'mock-node',
      payload: {
        cpu_percent: point.cpu,
        memory_percent: point.memory,
        network_bytes: point.network * 1024,
        disk_percent: point.disk || 55,
      },
    };
    emit('telemetry', telemetry);
    mockIdx++;

    // Occasional alert
    if (mockIdx % 15 === 0) {
      const alert = { ...mockAlerts[mockIdx % mockAlerts.length], id: `alert-mock-${mockIdx}`, created_at: new Date().toISOString() };
      emit('alert', alert);
    }

    // Occasional dropped packet
    if (mockIdx % 10 === 0) {
      const dp = { ...mockDroppedPackets[mockIdx % mockDroppedPackets.length], timestamp: new Date().toISOString() };
      emit('ip:dropped', dp);
    }
  }, 2000);

  socket = mockSocket;
  return mockSocket;
}

// ── Helper exports expected by hooks ────────────────────
export function connectSocket() {
  return getSocket();
}

export function subscribeToTelemetry(callback) {
  const s = getSocket();
  s.on('telemetry', callback);
  return () => s.off('telemetry', callback);
}

export function onConnect(callback) {
  const s = getSocket();
  s.on('connect', callback);
  return () => s.off('connect', callback);
}

export function onDisconnect(callback) {
  const s = getSocket();
  s.on('disconnect', callback);
  return () => s.off('disconnect', callback);
}
