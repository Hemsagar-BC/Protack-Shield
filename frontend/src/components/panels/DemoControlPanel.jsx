import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Play, X, Loader2 } from 'lucide-react';

export default function DemoControlPanel({ isOpen, onClose, scenarios, activeScenario, isRunning, progress, onRunScenario, onStopScenario }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 bottom-0 w-80 z-[90] glass-card border-l border-white/10 p-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-neon-blue" />
            <h2 className="text-sm font-bold tracking-wider">DEMO SCENARIOS</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>

        <p className="text-[10px] text-gray-500 mb-4">
          Run pre-built scenarios to see detection and response in action. Each scenario simulates real attack patterns.
        </p>

        {/* Progress */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neon-blue font-semibold uppercase tracking-wider">
                Running: {scenarios?.[activeScenario]?.name || activeScenario}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-neon-blue rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStopScenario}
              className="mt-2 w-full py-1.5 bg-neon-red/10 text-neon-red rounded-lg text-xs font-semibold hover:bg-neon-red/20 transition-colors"
            >
              Stop Scenario
            </motion.button>
          </motion.div>
        )}

        {/* Scenario Cards */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {Object.entries(scenarios || {}).map(([key, scenario]) => {
            const isActive = activeScenario === key;

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className={`glass-card-hover p-3 ${isActive ? 'neon-border' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">{scenario.name}</h3>
                  <span className="text-[10px] text-gray-500 font-mono">{(scenario.duration / 1000).toFixed(0)}s</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">{scenario.description}</p>
                <div className="flex items-center gap-1 mb-2">
                  {scenario.stages?.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${isActive && progress > (i / scenario.stages.length) * 100 ? 'bg-neon-blue' : 'bg-white/10'}`} />
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isRunning}
                  onClick={() => onRunScenario(key)}
                  className="w-full py-1.5 bg-neon-blue/10 text-neon-blue rounded text-xs font-semibold hover:bg-neon-blue/20 transition-colors disabled:opacity-30 flex items-center justify-center gap-1"
                >
                  {isRunning && isActive ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
                  ) : (
                    <><Play className="w-3 h-3" /> Run Scenario</>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
