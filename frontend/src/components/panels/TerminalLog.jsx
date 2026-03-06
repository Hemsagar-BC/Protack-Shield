import { Terminal } from 'lucide-react';

/**
 * Standalone terminal log component — available for additional terminal views.
 * A simpler version of TelemetryTerminal for embedding in other panels.
 */
export default function TerminalLog({ lines = [], maxLines = 50, title = 'Log' }) {
  const displayLines = lines.slice(-maxLines);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-3.5 h-3.5 text-neon-green" />
        <span className="text-xs font-bold tracking-wider text-neon-green">{title}</span>
        <span className="text-[10px] text-gray-500 font-mono">{lines.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto bg-black/40 rounded-lg border border-white/5 p-2 font-mono text-[10px] text-gray-400">
        {displayLines.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No log entries</p>
        ) : (
          displayLines.map((line, i) => (
            <div key={i} className="hover:bg-white/5 px-1 rounded leading-relaxed">
              {typeof line === 'string' ? line : JSON.stringify(line)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
