import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Pause, Play, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';

export default function TelemetryTerminal({ events = [], isPaused, onTogglePause }) {
  const [viewMode, setViewMode] = useState('compact'); // compact | json
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neon-green" />
          <h3 className="text-xs font-bold tracking-wider text-neon-green">TELEMETRY LOG</h3>
          <span className="text-[10px] text-gray-500 font-mono">{events.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setViewMode(v => v === 'compact' ? 'json' : 'compact')}
            className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors text-gray-400"
          >
            {viewMode === 'compact' ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
            {viewMode === 'compact' ? 'Compact' : 'JSON'}
          </button>

          {/* Pause */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onTogglePause}
            className={`p-1 rounded transition-colors ${isPaused ? 'bg-neon-amber/20 text-neon-amber' : 'hover:bg-white/10 text-gray-400'}`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </motion.button>

          {/* Scroll to bottom */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400"
          >
            <ArrowDown className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto bg-black/40 rounded-lg border border-white/5 p-2 font-mono text-[11px]"
      >
        {events.length === 0 ? (
          <div className="text-gray-600 text-center py-4">
            <Terminal className="w-6 h-6 mx-auto mb-1" />
            <p>Waiting for telemetry events…</p>
          </div>
        ) : viewMode === 'compact' ? (
          events.map((evt) => (
            <CompactLine key={evt.id} event={evt} />
          ))
        ) : (
          events.map((evt) => (
            <JsonLine key={evt.id} event={evt} />
          ))
        )}
      </div>
    </div>
  );
}

function CompactLine({ event }) {
  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const data = event.data || {};
  const type = data.event_type || data.type || 'telemetry';
  const source = data.deviceName || data.deviceId || data.source_ip || data.device_id || data.service || 'unknown';
  const metrics = data.metrics || data.payload || {};

  const typeColors = {
    http_request: 'text-neon-blue',
    auth_attempt: 'text-neon-amber',
    network_flow: 'text-neon-cyan',
    system_metric: 'text-neon-green',
    telemetry: 'text-neon-green',
  };

  const cpuVal = metrics.cpu_percent ?? metrics.cpu;
  const memVal = metrics.memory_percent ?? metrics.memory;

  return (
    <div className="flex gap-2 leading-relaxed hover:bg-white/5 px-1 rounded">
      <span className="text-gray-600 flex-shrink-0">{time}</span>
      <span className={`flex-shrink-0 ${typeColors[type] || 'text-gray-400'}`}>[{type}]</span>
      <span className="text-gray-500 flex-shrink-0">{source}</span>
      <span className="text-gray-400 truncate">
        {cpuVal != null || memVal != null
          ? `cpu:${cpuVal?.toFixed?.(1) ?? '?'}% mem:${memVal?.toFixed?.(1) ?? '?'}%`
          : data.payload
            ? typeof data.payload === 'string'
              ? data.payload.slice(0, 60)
              : JSON.stringify(data.payload).slice(0, 60)
            : ''}
      </span>
    </div>
  );
}

function JsonLine({ event }) {
  return (
    <pre className="text-gray-400 leading-relaxed hover:bg-white/5 px-1 rounded whitespace-pre-wrap break-all text-[10px]">
      <span className="text-gray-600">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false }) + ' '  : ''}</span>
      {syntaxHighlight(JSON.stringify(event.data || event, null, 2))}
    </pre>
  );
}

function syntaxHighlight(json) {
  return json
    .replace(/"([^"]+)":/g, '<span class="text-neon-blue">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="text-neon-green">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="text-neon-amber">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-neon-purple">$1</span>')
    .split('\n')
    .map((line, i) => (
      <span key={i} dangerouslySetInnerHTML={{ __html: line + '\n' }} />
    ));
}
