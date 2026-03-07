import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlertCard from '../alerts/AlertCard';
import AlertDetailModal from '../alerts/AlertDetailModal';
import { Shield, Filter, CheckCheck, AlertTriangle } from 'lucide-react';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'ml', label: 'ML' },
  { key: 'acknowledged', label: 'ACK' },
];

export default function AlertsPanel({ alerts, filter, setFilter, onAcknowledge, onAcknowledgeAll, stats }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon-red" />
            <h2 className="text-sm font-bold tracking-wider">ALERTS</h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-neon-red/20 text-neon-red rounded-full font-mono">
              {stats?.active ?? 0}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAcknowledgeAll}
            className="text-[10px] px-2 py-1 bg-neon-green/10 text-neon-green rounded hover:bg-neon-green/20 transition-colors flex items-center gap-1"
            title="Acknowledge all"
          >
            <CheckCheck className="w-3 h-3" />
            ACK All
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniStat label="Total" value={stats?.total ?? 0} color="text-gray-300" />
          <MiniStat label="Critical" value={stats?.critical ?? 0} color="text-neon-red" />
          <MiniStat label="ACK'd" value={stats?.acknowledged ?? 0} color="text-neon-green" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap border transition-colors ${
                filter === tab.key ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-gray-500"
              >
                <Shield className="w-8 h-8 mb-2 text-gray-600" />
                <p className="text-xs">No alerts matching filter</p>
              </motion.div>
            ) : (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onClick={setSelectedAlert}
                  onAcknowledge={onAcknowledge}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAlertUpdate={(id, updates) => {
            setSelectedAlert(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
          }}
        />
      )}
    </>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="glass-card p-2 text-center">
      <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
