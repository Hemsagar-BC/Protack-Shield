const DEVICE_ICONS = {
  pacemaker: '❤️', mri_scanner: '🔬', infusion_pump: '💉',
  soil_sensor: '🌱', drone_scout: '🚁', irrigation_valve: '💧',
  traffic_light: '🚦', smart_meter: '⚡', cctv_camera: '📹', nvr_recorder: '🖥️',
}

function DeviceCard({ id, info, isSelected, onSelect }) {
  const health = info.health ?? 100
  const status = info.status || 'online'
  const type = info.type || 'unknown'

  let barColor = 'bg-emerald-500'
  let textColor = 'text-emerald-400'
  let borderExtra = ''
  let bgExtra = ''
  let pulseClass = ''

  if (health < 70) {
    barColor = 'bg-amber-500'
    textColor = 'text-amber-400'
  }
  if (health < 30) {
    barColor = 'bg-red-500'
    textColor = 'text-red-400'
    pulseClass = 'pulse-critical'
  }

  if (isSelected) {
    borderExtra = 'border-blue-500/60 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
  }

  const statusStyles = {
    online: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    compromised: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div
      onClick={() => onSelect(id)}
      className={`relative bg-[#0f172a] border border-white/5 rounded-xl p-3.5 cursor-pointer transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/5 ${borderExtra} ${bgExtra} ${pulseClass}`}
    >
      {isSelected && (
        <span className="absolute -top-2 right-2 text-[0.6rem] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
          TARGET
        </span>
      )}
      <div className="text-2xl mb-2">{DEVICE_ICONS[type] || '📟'}</div>
      <div className="text-sm text-white font-medium mb-0.5 break-all">{id}</div>
      <div className="text-[0.65rem] text-slate-500 mb-3 uppercase tracking-wider">
        {type.replace('_', ' ')}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${health}%` }} />
        </div>
        <span className={`text-xs font-semibold ${textColor}`}>{health}%</span>
      </div>
      <div className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 inline-block rounded-full border text-center ${statusStyles[status] || statusStyles.online}`}>
        {status}
      </div>
    </div>
  )
}

export default function VirtualIoTFleet({ devices, sector, selectedDevice, onSelectDevice, onHealAll, onResetFleet }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Virtual IoT Fleet
          </h2>
        </div>
        <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          {sector?.toUpperCase()}
        </span>
      </div>

      {Object.keys(devices).length === 0 ? (
        <div className="text-center text-slate-500 py-10">
          <span className="text-3xl block mb-2 opacity-50">📡</span>
          <span className="text-sm">Loading devices...</span>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mb-4">
          {Object.entries(devices).map(([id, info]) => (
            <DeviceCard
              key={id}
              id={id}
              info={info}
              isSelected={selectedDevice === id}
              onSelect={onSelectDevice}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onHealAll}
          className="flex-1 bg-[#0b1120] text-slate-300 border border-white/10 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5"
        >
          🔧 Heal All
        </button>
        <button
          onClick={onResetFleet}
          className="flex-1 bg-[#0b1120] text-slate-300 border border-white/10 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5"
        >
          🔄 Reset Fleet
        </button>
      </div>
    </div>
  )
}
