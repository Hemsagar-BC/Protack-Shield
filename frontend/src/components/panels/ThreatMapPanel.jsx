import { motion } from 'framer-motion';
import { Monitor, Cpu, ChevronRight } from 'lucide-react';

export default function ThreatMapPanel({ devices = {}, activeDevice, onSelectDevice }) {
  const deviceList = Object.values(devices);

  const sectorIcons = {
    healthcare: '🏥',
    agriculture: '🌾',
    urban: '🏙️',
    general: '💻',
    iot: '📡',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-4 h-4 text-neon-blue" />
        <h2 className="text-sm font-bold tracking-wider">THREAT MAP</h2>
        <span className="text-[10px] px-1.5 py-0.5 bg-neon-blue/20 text-neon-blue rounded-full font-mono">
          {deviceList.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 pr-1">
        {deviceList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Cpu className="w-8 h-8 mb-2 text-gray-600" />
            <p className="text-xs">No devices detected</p>
            <p className="text-[10px] text-gray-600 mt-1">Waiting for telemetry…</p>
          </div>
        ) : (
          deviceList.map((device) => {
            const isActive = activeDevice === device.id;
            const isOnline = device.status === 'online' || (Date.now() - (device.lastSeen || 0) < 30000);

            return (
              <motion.button
                key={device.id}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectDevice(device.id)}
                className={`w-full text-left glass-card-hover p-2.5 flex items-center gap-2.5 transition-all ${
                  isActive ? 'neon-border bg-neon-blue/5' : ''
                }`}
              >
                <span className="text-base flex-shrink-0">
                  {sectorIcons[device.sector] || sectorIcons.general}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className={`status-dot ${isOnline ? 'status-connected' : 'status-disconnected'}`} />
                    <span className="text-xs font-semibold truncate">{device.id}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono truncate">{device.ip || 'N/A'}</p>
                </div>

                <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-colors ${isActive ? 'text-neon-blue' : 'text-gray-600'}`} />
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
