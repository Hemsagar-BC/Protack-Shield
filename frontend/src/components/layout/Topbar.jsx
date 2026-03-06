import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, AlertTriangle, Clock, Wifi, WifiOff, Radio } from 'lucide-react';

export default function Topbar({ connectionStatus = 'disconnected', stats = {}, onToggleDemo }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: { color: 'status-connected', label: 'Connected', Icon: Wifi },
    degraded: { color: 'status-degraded', label: 'Degraded', Icon: Radio },
    disconnected: { color: 'status-disconnected', label: 'Disconnected', Icon: WifiOff },
  };

  const { color, label, Icon } = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card border-b border-white/10 px-4 py-2 flex items-center justify-between z-50 relative"
    >
      {/* Left — Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="w-8 h-8 text-neon-blue" />
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ['0 0 8px rgba(0,212,255,0.3)', '0 0 20px rgba(0,212,255,0.6)', '0 0 8px rgba(0,212,255,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wider neon-text">PROTACK SHIELD</h1>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase">SOC Dashboard v1.0</p>
        </div>
      </div>

      {/* Center — Connection Status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
          <div className={`status-dot ${color}`} />
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-300">{label}</span>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4">
          <StatBadge icon={<Activity className="w-3.5 h-3.5" />} label="Events/min" value={stats.eventsPerMin ?? 0} color="text-neon-blue" />
          <StatBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Active" value={stats.activeAlerts ?? 0} color="text-neon-amber" />
          <StatBadge icon={<Shield className="w-3.5 h-3.5" />} label="Blocked" value={stats.blockedCount ?? 0} color="text-neon-red" />
        </div>
      </div>

      {/* Right — Clock & Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-gray-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{time.toLocaleTimeString()}</span>
          <span className="text-gray-600">|</span>
          <span className="font-mono text-gray-500">{time.toLocaleDateString()}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleDemo}
          className="glass-card px-3 py-1.5 rounded-lg text-xs text-neon-blue hover:bg-neon-blue/10 border border-neon-blue/30 transition-colors"
        >
          Demo
        </motion.button>
      </div>
    </motion.header>
  );
}

function StatBadge({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={color}>{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className={`font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
