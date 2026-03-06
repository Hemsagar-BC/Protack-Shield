import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ShieldCheck, Info, Brain, Clock } from 'lucide-react';

const severityConfig = {
  critical: {
    border: 'border-neon-red/50',
    bg: 'severity-critical',
    icon: <ShieldAlert className="w-4 h-4 text-neon-red" />,
    badge: 'bg-neon-red/20 text-neon-red',
    glow: 'hover:shadow-neon-red',
  },
  warning: {
    border: 'border-neon-amber/50',
    bg: 'severity-warning',
    icon: <AlertTriangle className="w-4 h-4 text-neon-amber" />,
    badge: 'bg-neon-amber/20 text-neon-amber',
    glow: 'hover:shadow-neon-amber',
  },
  normal: {
    border: 'border-neon-green/50',
    bg: 'severity-normal',
    icon: <ShieldCheck className="w-4 h-4 text-neon-green" />,
    badge: 'bg-neon-green/20 text-neon-green',
    glow: 'hover:shadow-neon-green',
  },
  info: {
    border: 'border-neon-blue/50',
    bg: 'severity-info',
    icon: <Info className="w-4 h-4 text-neon-blue" />,
    badge: 'bg-neon-blue/20 text-neon-blue',
    glow: 'hover:shadow-neon-blue',
  },
};

export default function AlertCard({ alert, onClick, onAcknowledge }) {
  const severity = alert.severity?.toLowerCase() || 'info';
  const config = severityConfig[severity] || severityConfig.info;
  const isML = alert.title?.includes('ML:') || alert.rule_id?.startsWith('ml_');
  const isAcknowledged = alert.acknowledged;

  const sectorMatch = alert.rule_id?.match(/health|agri|urban/i);
  const sector = sectorMatch ? sectorMatch[0].toLowerCase() : null;
  const sectorLabels = { health: 'Healthcare', agri: 'Agriculture', urban: 'Urban' };

  const timeAgo = getTimeAgo(alert.created_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(alert)}
      className={`glass-card-hover p-3 cursor-pointer ${config.bg} ${isAcknowledged ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {config.icon}
          <h4 className="text-sm font-semibold truncate">{alert.title}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isML && (
            <span className="px-1.5 py-0.5 bg-neon-purple/20 text-neon-purple rounded text-[10px] font-bold flex items-center gap-0.5">
              <Brain className="w-2.5 h-2.5" /> ML
            </span>
          )}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${config.badge}`}>
            {severity}
          </span>
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2">
        <span className="font-mono">{alert.rule_id}</span>
        {alert.confidence != null && (
          <span>conf: {(alert.confidence * 100).toFixed(0)}%</span>
        )}
        {sector && (
          <span className="px-1 py-0.5 bg-white/10 rounded text-[9px]">{sectorLabels[sector]}</span>
        )}
      </div>

      {/* Evidence Preview */}
      {alert.evidence && (
        <div className="text-[10px] text-gray-500 font-mono bg-black/20 rounded p-1.5 mb-2 truncate">
          {typeof alert.evidence === 'string'
            ? alert.evidence
            : JSON.stringify(alert.evidence).slice(0, 80) + '…'}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock className="w-2.5 h-2.5" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${isAcknowledged ? 'text-neon-green' : 'text-neon-amber'}`}>
            {isAcknowledged ? 'NEUTRALIZED' : 'DETECTED'}
          </span>
          {!isAcknowledged && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onAcknowledge?.(alert.id); }}
              className="px-2 py-0.5 bg-neon-green/20 text-neon-green rounded text-[10px] hover:bg-neon-green/30 transition-colors"
            >
              ACK
            </motion.button>
          )}
        </div>
      </div>

      {/* Critical pulse glow */}
      {severity === 'critical' && !isAcknowledged && (
        <motion.div
          className="absolute inset-0 rounded-xl border border-neon-red/30 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
