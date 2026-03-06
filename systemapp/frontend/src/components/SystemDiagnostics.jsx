import { useRef, useEffect } from 'react'

/* ── Canvas Sparkline with grid ── */
function MiniGraph({ history = [], color = '#3b82f6' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width  = rect.width  * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height
    ctx.clearRect(0, 0, W, H)

    const TOTAL = 60
    const max = 100
    const toY = (v) => H - (v / max) * (H - 4) - 2   // 2px padding top/bottom

    // ── Grid ──
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 0.5
    // horizontal lines at 0%, 25%, 50%, 75%, 100%
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = toY(pct)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    // vertical lines — 6 columns
    for (let i = 1; i < 6; i++) {
      const x = (W / 6) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }

    const pts = history.map(p => p.v)
    if (pts.length < 2) return

    const step = W / (TOTAL - 1)
    const startX = W - (pts.length - 1) * step   // right-align data

    // filled area
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, color + '44')
    grad.addColorStop(1, color + '00')
    ctx.beginPath()
    ctx.moveTo(startX, H)
    pts.forEach((v, i) => ctx.lineTo(startX + i * step, toY(v)))
    ctx.lineTo(startX + (pts.length - 1) * step, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // line
    ctx.beginPath()
    pts.forEach((v, i) => {
      const x = startX + i * step
      const y = toY(v)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap  = 'round'
    ctx.stroke()
  }, [history, color])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-16 rounded-md"
      style={{ display: 'block' }}
    />
  )
}

/* ── Metric Card (no graph) ── */
function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-blue-400 text-sm">{icon}</span>}
        <span className="text-[0.7rem] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  )
}

/* ── Graph Metric card (no progress bar) ── */
function GraphMetric({ label, value, icon, color = 'blue', history }) {
  const palettes = {
    blue:   { text: 'text-blue-400',   hex: '#3b82f6' },
    purple: { text: 'text-purple-400', hex: '#a855f7' },
    cyan:   { text: 'text-cyan-400',   hex: '#06b6d4' },
    amber:  { text: 'text-amber-400',  hex: '#f59e0b' },
  }
  const c = palettes[color] || palettes.blue

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-colors">
      {/* header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className={`text-sm ${c.text}`}>{icon}</span>}
          <span className="text-[0.7rem] text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${c.text}`}>{value}</span>
      </div>

      {/* sparkline graph */}
      <MiniGraph history={history || []} color={c.hex} />
    </div>
  )
}

export default function SystemDiagnostics({ health, status, cpuHistory, memHistory, diskHistory }) {
  const formatUptime = (secs) => {
    if (!secs) return '00:00:00'
    const d = Math.floor(secs / 86400)
    const h = String(Math.floor((secs % 86400) / 3600)).padStart(2, '0')
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}:${m}:${s}`
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          System Diagnostics
        </h2>
      </div>

      {/* Device info banner */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-6">
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Device ID</span>
          <span className="text-white font-medium">{status?.device?.toUpperCase() || 'LOADING...'}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">IP Address</span>
          <span className="text-white font-medium">{health?.device_ip || '...'}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Uptime</span>
          <span className="text-blue-400 font-medium">{formatUptime(health?.uptime_seconds)}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Cores / Threads</span>
          <span className="text-white font-medium">{health ? `${health.cpu_cores} / ${health.cpu_threads}` : '—'}</span>
        </div>
      </div>

      {/* Metrics grid — 3 graph cards + 3 plain cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <GraphMetric label="CPU" value={health ? `${health.cpu}%` : '—'} icon="⚡" color="blue" history={cpuHistory} />
        <GraphMetric label="Memory" value={health ? `${health.memory}%` : '—'} icon="🧠" color="purple" history={memHistory} />
        <GraphMetric label="Disk I/O" value={health ? `${health.disk}%` : '—'} icon="💾" color="cyan" history={diskHistory} />
        <MetricCard label="Processes" value={health?.processes ?? '—'} icon="📊" />
        <MetricCard label="Net Sent" value={health ? `${health.network_sent_mb} MB` : '—'} icon="📤" />
        <MetricCard label="Net Recv" value={health ? `${health.network_recv_mb} MB` : '—'} icon="📥" />
      </div>
    </div>
  )
}
