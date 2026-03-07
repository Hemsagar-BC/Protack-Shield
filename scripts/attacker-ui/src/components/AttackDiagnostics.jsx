/* ── Attack Diagnostics: same layout as victim's SystemDiagnostics ── */

function MetricCard({ label, value, icon, valueColor = 'text-white' }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-red-500/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-red-400 text-sm">{icon}</span>}
        <span className="text-[0.7rem] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-semibold ${valueColor}`}>{value}</div>
    </div>
  )
}

export default function AttackDiagnostics({ stats, isAttacking }) {
  return (
    <div>
      {/* Section header — same style as victim node */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-red-500 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Attack Diagnostics
        </h2>
      </div>

      {/* Info banner — mirrors victim's device info banner */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-6">
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Attack Mode</span>
          <span className="text-white font-medium">{isAttacking ? 'ACTIVE' : 'STANDBY'}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Total Sent</span>
          <span className="text-red-400 font-medium">{stats.sent}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Delivered</span>
          <span className="text-emerald-400 font-medium">{stats.success}</span>
        </div>
        <div className="w-px h-8 bg-white/10 hidden sm:block" />
        <div>
          <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider block">Blocked</span>
          <span className="text-amber-400 font-medium">{stats.failed}</span>
        </div>
      </div>

      {/* Metrics grid — same 6-col pattern as victim node */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Requests Sent" value={stats.sent} icon="🚀" valueColor="text-red-400" />
        <MetricCard label="Delivered" value={stats.success} icon="✅" valueColor="text-emerald-400" />
        <MetricCard label="Blocked" value={stats.failed} icon="🛡️" valueColor="text-amber-400" />
        <MetricCard label="Success Rate" value={stats.sent > 0 ? `${Math.round((stats.success / stats.sent) * 100)}%` : '—'} icon="📊" />
        <MetricCard label="Block Rate" value={stats.sent > 0 ? `${Math.round((stats.failed / stats.sent) * 100)}%` : '—'} icon="📉" />
        <MetricCard label="Status" value={isAttacking ? 'ATTACKING' : 'IDLE'} icon={isAttacking ? '⚡' : '💤'} valueColor={isAttacking ? 'text-red-400' : 'text-slate-400'} />
      </div>
    </div>
  )
}
