import { useRef, useEffect } from 'react'

export default function ConsoleOutput({ logs, onClear }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [logs])

  const colorMap = {
    system: 'text-slate-500',
    success: 'text-emerald-400',
    error: 'text-red-400',
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-red-500 rounded-full" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Console Output
          </h2>
        </div>
        <button
          onClick={onClear}
          className="px-3 py-1 text-[0.65rem] bg-white/5 text-slate-400 border border-white/10 rounded-md cursor-pointer hover:bg-white/10 hover:text-slate-300 transition-all font-medium uppercase"
        >
          Clear
        </button>
      </div>

      <div ref={bodyRef} className="bg-[#0b1120] p-4 overflow-y-auto text-sm font-mono max-h-[200px] min-h-[150px]">
        {logs.map((log, i) => (
          <div key={i} className={`mb-1 ${colorMap[log.type] || colorMap.system}`}>
            <span className="text-slate-600 text-xs mr-2">{log.time}</span>
            {log.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
