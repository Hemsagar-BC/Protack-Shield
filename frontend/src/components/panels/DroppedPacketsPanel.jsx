import { motion, AnimatePresence } from 'framer-motion';
import { ShieldBan, Database, User, Waves, Code, Ban, BarChart3, RefreshCw } from 'lucide-react';

const categoryConfig = {
  sql_injection: { icon: Database, color: 'text-neon-red', label: 'SQL Injection' },
  brute_force: { icon: User, color: 'text-neon-amber', label: 'Brute Force' },
  flooding: { icon: Waves, color: 'text-neon-blue', label: 'Flooding' },
  xss: { icon: Code, color: 'text-neon-purple', label: 'XSS' },
  blocked_ip: { icon: Ban, color: 'text-gray-400', label: 'Blocked IP' },
  rate_limit: { icon: BarChart3, color: 'text-neon-cyan', label: 'Rate Limit' },
};

export default function DroppedPacketsPanel({ packets = [], stats = {}, totalDropped = 0, onRefresh }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldBan className="w-4 h-4 text-neon-red" />
          <h2 className="text-sm font-bold tracking-wider">DROPPED PACKETS</h2>
          <span className="text-[10px] px-1.5 py-0.5 bg-neon-red/20 text-neon-red rounded-full font-mono">
            {totalDropped}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="glass-card p-2 text-center">
              <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${cfg.color}`} />
              <p className={`text-sm font-bold font-mono ${cfg.color}`}>{stats[key] || 0}</p>
              <p className="text-[8px] text-gray-500 uppercase">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Packet List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        <AnimatePresence>
          {packets.map((pkt, idx) => {
            const type = pkt.attack_type || 'blocked_ip';
            const cfg = categoryConfig[type] || categoryConfig.blocked_ip;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={`${pkt.timestamp}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.02 }}
                className="glass-card-hover p-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded ${cfg.color.replace('text-', 'bg-')}/10`}>
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {pkt.timestamp ? new Date(pkt.timestamp).toLocaleTimeString('en-US', { hour12: false }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono truncate">{pkt.ip || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{pkt.reason || pkt.endpoint || ''}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {packets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <ShieldBan className="w-8 h-8 mb-2 text-gray-600" />
            <p className="text-xs">No dropped packets</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
