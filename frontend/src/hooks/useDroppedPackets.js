import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { fetchDroppedPackets, fetchDroppedStats } from '../services/api';
import { mockDroppedPackets } from '../mock/data';

const MAX_PACKETS = 200;

export function useDroppedPackets() {
  const [packets, setPackets] = useState([]);
  const [stats, setStats] = useState({
    sql_injection: 0,
    brute_force: 0,
    flooding: 0,
    xss: 0,
    blocked_ip: 0,
    rate_limit: 0,
  });

  // Initial fetch
  useEffect(() => {
    (async () => {
      const data = await fetchDroppedPackets();
      if (data && data.length) setPackets(data);

      const s = await fetchDroppedStats();
      if (s) setStats(s);
    })();
  }, []);

  // WebSocket updates
  useEffect(() => {
    const socket = getSocket();

    const handleDropped = (packet) => {
      if (!packet) return;
      setPackets(prev => [packet, ...prev].slice(0, MAX_PACKETS));

      // Increment stat
      setStats(prev => {
        const key = packet.attack_type || 'blocked_ip';
        return { ...prev, [key]: (prev[key] || 0) + 1 };
      });
    };

    socket.on('ip:dropped', handleDropped);
    socket.on('ip:blocked', (data) => {
      if (data) {
        handleDropped({ ...data, attack_type: 'blocked_ip', endpoint: 'n/a', reason: data.reason || 'IP blocked' });
      }
    });

    return () => {
      socket.off('ip:dropped', handleDropped);
      socket.off('ip:blocked');
    };
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchDroppedPackets();
    if (data) setPackets(data);
    const s = await fetchDroppedStats();
    if (s) setStats(s);
  }, []);

  const totalDropped = Object.values(stats).reduce((a, b) => a + b, 0);

  return { packets, stats, totalDropped, refresh };
}
