import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Ban, Gauge, Server, Trash2, RefreshCw, Plus } from 'lucide-react';
import {
  fetchBlockedIPs, fetchThrottledIPs, fetchResponseStatus,
  unblockIP, unthrottleIP, restoreService, clearAllBlocks,
} from '../../services/api';
import { mockResponseStatus } from '../../mock/data';

export default function ResponseStatusPanel() {
  const [blockedIPs, setBlockedIPs] = useState(mockResponseStatus.blocked_ips);
  const [throttledIPs, setThrottledIPs] = useState(mockResponseStatus.throttled_ips);
  const [isolatedServices, setIsolatedServices] = useState(mockResponseStatus.isolated_services);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blocked, throttled, status] = await Promise.all([
        fetchBlockedIPs(),
        fetchThrottledIPs(),
        fetchResponseStatus(),
      ]);
      if (blocked) setBlockedIPs(Array.isArray(blocked) ? blocked : mockResponseStatus.blocked_ips);
      if (throttled) setThrottledIPs(Array.isArray(throttled) ? throttled : mockResponseStatus.throttled_ips);
      if (status?.isolated_services) setIsolatedServices(status.isolated_services);
    } catch (e) {
      console.warn('Failed to load response status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUnblock = async (ip) => {
    await unblockIP(ip);
    setBlockedIPs(prev => prev.filter(i => (typeof i === 'string' ? i : i.ip) !== ip));
  };

  const handleUnthrottle = async (ip) => {
    await unthrottleIP(ip);
    setThrottledIPs(prev => prev.filter(i => (typeof i === 'string' ? i : i.ip) !== ip));
  };

  const handleRestore = async (service) => {
    await restoreService(service);
    setIsolatedServices(prev => prev.filter(s => s !== service));
  };

  const handleClearAll = async () => {
    await clearAllBlocks();
    setBlockedIPs([]);
    setThrottledIPs([]);
    setIsolatedServices([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto pr-2"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-neon-green" />
          <h2 className="text-sm font-bold tracking-wider">RESPONSE STATUS</h2>
        </div>
        <div className="flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.1, rotate: 180 }} onClick={loadData} className="p-1 hover:bg-white/10 rounded">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} onClick={handleClearAll} className="p-1 hover:bg-white/10 rounded" title="Reset all">
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Blocked IPs */}
      <Section title="Blocked IPs" icon={Ban} color="text-neon-red" count={blockedIPs.length}>
        {blockedIPs.map((entry, idx) => {
          const ip = typeof entry === 'string' ? entry : entry.ip;
          return (
            <IPRow key={ip || idx} ip={ip} onRemove={() => handleUnblock(ip)} color="neon-red" />
          );
        })}
      </Section>

      {/* Throttled IPs */}
      <Section title="Throttled IPs" icon={Gauge} color="text-neon-amber" count={throttledIPs.length}>
        {throttledIPs.map((entry, idx) => {
          const ip = typeof entry === 'string' ? entry : entry.ip;
          return (
            <IPRow key={ip || idx} ip={ip} onRemove={() => handleUnthrottle(ip)} color="neon-amber" />
          );
        })}
      </Section>

      {/* Isolated Services */}
      <Section title="Isolated Services" icon={Server} color="text-neon-purple" count={isolatedServices.length}>
        {isolatedServices.map((svc) => (
          <motion.div
            key={svc}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between glass-card p-2 mb-1"
          >
            <div className="flex items-center gap-2">
              <Server className="w-3 h-3 text-neon-purple" />
              <span className="text-xs font-mono">{svc}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRestore(svc)}
              className="text-[10px] px-2 py-0.5 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20"
            >
              Restore
            </motion.button>
          </motion.div>
        ))}
      </Section>
    </motion.div>
  );
}

function Section({ title, icon: Icon, color, count, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{title}</span>
        <span className="text-[10px] text-gray-500">({count})</span>
      </div>
      {count === 0 ? (
        <p className="text-[10px] text-gray-600 pl-5">None active</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  );
}

function IPRow({ ip, onRemove, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between glass-card p-2"
    >
      <div className="flex items-center gap-2">
        <Ban className={`w-3 h-3 text-${color}`} />
        <span className="text-xs font-mono">{ip}</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="text-[10px] px-2 py-0.5 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20"
      >
        Unblock
      </motion.button>
    </motion.div>
  );
}
