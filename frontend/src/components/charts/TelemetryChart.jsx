import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick, Wifi } from 'lucide-react';

const METRICS = [
  { key: 'cpu', label: 'CPU', color: '#00d4ff', icon: Cpu, unit: '%' },
  { key: 'memory', label: 'Memory', color: '#a855f7', icon: MemoryStick, unit: '%' },
  { key: 'network', label: 'Network', color: '#00ff88', icon: Wifi, unit: 'KB/s' },
];

export default function TelemetryChart({ data = [], activeMetrics, onToggleMetric }) {
  const visibleMetrics = activeMetrics || ['cpu', 'memory', 'network'];

  const formattedData = data.map((point) => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
  }));

  const latestPoint = data[data.length - 1] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      {/* Metric toggles + current values */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {METRICS.map((m) => {
          const active = visibleMetrics.includes(m.key);
          const Icon = m.icon;
          const value = latestPoint[m.key];
          return (
            <motion.button
              key={m.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggleMetric?.(m.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                active
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-transparent text-gray-500'
              }`}
              style={active ? { borderColor: m.color + '50', color: m.color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
              {value != null && (
                <span className="font-mono" style={{ color: active ? m.color : undefined }}>
                  {typeof value === 'number' ? value.toFixed(1) : value}{m.unit}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {METRICS.map((m) => (
                <linearGradient key={m.key} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

            <XAxis
              dataKey="time"
              stroke="#4a5568"
              tick={{ fontSize: 10, fill: '#718096' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#4a5568"
              tick={{ fontSize: 10, fill: '#718096' }}
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 14, 26, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#718096' }}
            />

            {/* Warning line at 85% */}
            <ReferenceLine
              y={85}
              stroke="#ffaa00"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              label={{ value: 'Warning 85%', fill: '#ffaa00', fontSize: 10, position: 'right' }}
            />

            {/* Critical line at 90% */}
            <ReferenceLine
              y={90}
              stroke="#ff3366"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              label={{ value: 'Critical 90%', fill: '#ff3366', fontSize: 10, position: 'right' }}
            />

            {METRICS.map((m) =>
              visibleMetrics.includes(m.key) ? (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  stroke={m.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${m.key})`}
                  dot={false}
                  animationDuration={300}
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
