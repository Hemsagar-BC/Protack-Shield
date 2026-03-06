import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Heart, Leaf, TrafficCone, Wifi, Server } from 'lucide-react';
import { fetchDevices, fetchNodes } from '../../services/api';
const sectorConfig = {
  healthcare: { icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', label: 'Healthcare' },
  agriculture: { icon: Leaf, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', label: 'Agriculture' },
  urban: { icon: TrafficCone, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', label: 'Urban' },
  general: { icon: Server, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30', label: 'General' },
};

export default function IoTMapPanel() {
  const [devices, setDevices] = useState([]);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const load = async () => {
      const d = await fetchDevices();
      if (d?.length) setDevices(d);
      const n = await fetchNodes();
      if (n?.length) setNodes(n);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const grouped = devices.reduce((acc, d) => {
    const sector = d.sector || 'general';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(d);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto pr-2"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-neon-cyan" />
        <h2 className="text-sm font-bold tracking-wider">IoT FLEET</h2>
        <span className="text-[10px] px-1.5 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded-full font-mono">
          {devices.length}
        </span>
      </div>

      {/* Physical Nodes */}
      {nodes.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Physical Nodes</p>
          <div className="grid grid-cols-2 gap-2">
            {nodes.map((node) => (
              <div key={node.node_id || node.id} className="glass-card p-2 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <Server className="w-3 h-3 text-neon-blue" />
                  <span className="font-semibold truncate">{node.node_id || node.id}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">{node.ip || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped by sector */}
      {Object.entries(grouped).map(([sector, devs]) => {
        const config = sectorConfig[sector] || sectorConfig.general;
        const Icon = config.icon;

        return (
          <div key={sector} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-gray-500">({devs.length})</span>
            </div>

            <div className="space-y-1.5">
              {devs.map((device, idx) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-card-hover p-2.5 ${config.border} border`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`status-dot ${device.status === 'online' ? 'status-connected' : device.status === 'warning' ? 'status-degraded' : 'status-disconnected'}`} />
                      <span className="text-xs font-semibold">{device.name || device.id}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{device.ip || ''}</span>
                  </div>

                  {/* Health bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${device.health ?? 0}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className={`h-full rounded-full ${
                          (device.health ?? 0) > 75
                            ? 'bg-neon-green'
                            : (device.health ?? 0) > 40
                            ? 'bg-neon-amber'
                            : 'bg-neon-red'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                      {device.health ?? 0}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
