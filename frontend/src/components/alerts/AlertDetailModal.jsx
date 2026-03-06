import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Play, AlertTriangle, Clock, Brain, FileJson } from 'lucide-react';
import { useState } from 'react';
import { executePlaybook } from '../../services/api';
import { mockPlaybooks } from '../../mock/data';

export default function AlertDetailModal({ alert, onClose }) {
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  if (!alert) return null;

  const isML = alert.title?.includes('ML:') || alert.rule_id?.startsWith('ml_');

  const handlePlaybook = async (playbook) => {
    setExecuting(true);
    try {
      await executePlaybook({
        alert_id: alert.id,
        rule_id: alert.rule_id,
        severity: alert.severity,
        evidence: alert.evidence,
        playbook: playbook.id,
      });
      setExecuted(true);
    } catch (err) {
      console.error('Playbook execution failed:', err);
    } finally {
      setExecuting(false);
    }
  };

  const severityColors = {
    critical: 'text-neon-red border-neon-red/50',
    warning: 'text-neon-amber border-neon-amber/50',
    normal: 'text-neon-green border-neon-green/50',
    info: 'text-neon-blue border-neon-blue/50',
  };

  const color = severityColors[alert.severity] || severityColors.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <Shield className={`w-6 h-6 mt-0.5 ${color.split(' ')[0]}`} />
              <div>
                <h2 className="text-xl font-bold">{alert.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span className={`px-2 py-0.5 rounded border ${color} text-[10px] font-bold uppercase`}>
                    {alert.severity}
                  </span>
                  {isML && (
                    <span className="px-1.5 py-0.5 bg-neon-purple/20 text-neon-purple rounded text-[10px] font-bold flex items-center gap-1">
                      <Brain className="w-3 h-3" /> ML Detected
                    </span>
                  )}
                  <span className="font-mono">{alert.rule_id}</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>

          {/* Info Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <InfoBox label="Source" value={alert.source || 'Unknown'} />
            <InfoBox label="Confidence" value={alert.confidence != null ? `${(alert.confidence * 100).toFixed(0)}%` : 'N/A'} />
            <InfoBox label="Status" value={alert.acknowledged ? 'Neutralized' : 'Active'} />
            <InfoBox label="Created" value={alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'N/A'} icon={<Clock className="w-3 h-3" />} />
          </div>

          {/* Evidence */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FileJson className="w-4 h-4 text-neon-blue" />
              <h3 className="text-sm font-semibold text-gray-300">Evidence</h3>
            </div>
            <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(alert.evidence || {}, null, 2)}
            </pre>
          </div>

          {/* Playbooks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-gray-300">Response Playbooks</h3>
            </div>

            {executed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border border-neon-green/30 text-center"
              >
                <Shield className="w-8 h-8 text-neon-green mx-auto mb-2" />
                <p className="text-neon-green font-semibold">Playbook Executed Successfully</p>
                <p className="text-xs text-gray-400 mt-1">Response actions have been initiated</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mockPlaybooks.map((pb) => (
                  <motion.button
                    key={pb.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={executing}
                    onClick={() => handlePlaybook(pb)}
                    className="glass-card-hover p-3 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="w-3 h-3 text-neon-green" />
                      <span className="text-sm font-semibold">{pb.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pb.actions.map((action) => (
                        <span key={action} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-400 font-mono">
                          {action}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            {!alert.acknowledged && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg text-sm font-semibold hover:bg-neon-green/30 transition-colors"
              >
                Acknowledge
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-lg p-2.5">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold flex items-center gap-1">
        {icon}
        {value}
      </p>
    </div>
  );
}
