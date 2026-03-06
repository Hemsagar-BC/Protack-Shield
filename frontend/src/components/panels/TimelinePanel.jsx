import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shield, Wifi, User, Cpu, AlertTriangle, Zap } from 'lucide-react';
import { mockTimelineEvents } from '../../mock/data';

const eventConfig = {
  auth: { icon: User, color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/30' },
  network: { icon: Wifi, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
  device: { icon: Cpu, color: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
  alert: { icon: AlertTriangle, color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30' },
  action: { icon: Shield, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
  error: { icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
};

export default function TimelinePanel({ events: externalEvents }) {
  const events = externalEvents?.length ? externalEvents : mockTimelineEvents;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto pr-2"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-neon-blue" />
        <h2 className="text-sm font-bold tracking-wider">EVENT TIMELINE</h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-neon-blue/30 via-neon-blue/10 to-transparent" />

        <AnimatePresence>
          <div className="space-y-3">
            {events.map((event, idx) => {
              const config = eventConfig[event.type] || eventConfig.network;
              const Icon = config.icon;
              const time = new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false });

              return (
                <motion.div
                  key={event.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 relative"
                >
                  {/* Dot on timeline */}
                  <div className={`relative z-10 w-8 h-8 rounded-full ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="glass-card-hover p-2.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                        {event.type}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{time}</span>
                    </div>
                    <p className="text-xs text-gray-300">{event.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
