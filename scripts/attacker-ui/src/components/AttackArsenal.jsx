import { useState } from 'react'

/* ── Attack Arsenal: Standard + Sector-specific attack cards ── */

/* Standard attacks — always visible */
const STANDARD_ATTACKS = [
  { type: 'sql',   label: 'SQL Injection',  desc: 'WEB BRAIN',       icon: '💉', status: 'ready' },
  { type: 'brute', label: 'Brute Force',    desc: 'AUTH CRACKING',   icon: '🔑', status: 'ready' },
  { type: 'ddos',  label: 'Network Flood',  desc: 'NETWORK SHIELD',  icon: '⚡', status: 'ready' },
  { type: 'scan',  label: 'Port Scan',      desc: 'RECONNAISSANCE',  icon: '🔍', status: 'ready' },
]

/* Sector-specific attacks — shown when that sector is active */
const SECTOR_ATTACKS = {
  healthcare:  [
    { type: 'healthcare', label: 'IoMT DDoS',    desc: 'HEALTH BRAIN',    icon: '🏥', status: 'ready' },
  ],
  agriculture: [
    { type: 'agriculture', label: 'Sensor Spoof', desc: 'AGRI BRAIN',      icon: '🌾', status: 'ready' },
  ],
  urban: [
    { type: 'urban', label: 'Traffic Jam',   desc: 'URBAN BRAIN',     icon: '🚦', status: 'ready' },
    { type: 'cctv',  label: 'CCTV Tamper',   desc: 'NETWORK SHIELD',  icon: '📹', status: 'ready' },
  ],
}

function AttackCard({ attack, isSelected, onSelect, isAttacking }) {
  return (
    <div
      onClick={() => !isAttacking && onSelect(attack.type)}
      className={`relative bg-[#0f172a] border rounded-xl p-3.5 cursor-pointer transition-all duration-300
        ${ isAttacking ? 'opacity-50 cursor-not-allowed' : '' }
        ${ isSelected
          ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
          : 'border-white/5 hover:border-red-500/50 hover:bg-red-500/5 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]'
        }`}
    >
      {isSelected && (
        <span className="absolute -top-2 right-2 text-[0.6rem] bg-red-600 text-white px-2 py-0.5 rounded-full font-medium shadow-lg">
          ARMED
        </span>
      )}
      <div className="text-2xl mb-2">{attack.icon}</div>
      <div className="text-sm text-white font-medium mb-0.5">{attack.label}</div>
      <div className="text-[0.65rem] text-slate-500 mb-3 uppercase tracking-wider">
        {attack.desc}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: '100%' }} />
        </div>
        <span className="text-xs font-semibold text-red-400">100%</span>
      </div>
      <div className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 inline-block rounded-full border text-center ${
        isSelected ? 'bg-red-600 text-white border-red-500' : 'bg-red-500/10 text-red-400 border-red-500/20'
      }`}>
        {isSelected ? 'armed' : attack.status}
      </div>
    </div>
  )
}

export default function AttackArsenal({ onLaunch, isAttacking, onStop, sector }) {
  const [selected, setSelected] = useState(null)
  const sectorAttacks = SECTOR_ATTACKS[sector] || []

  const handleSelect = (type) => {
    setSelected((prev) => (prev === type ? null : type))
  }

  const handleLaunchSelected = () => {
    if (selected) onLaunch(selected)
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-red-500 rounded-full" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Attack Arsenal
          </h2>
        </div>
        <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          {sector?.toUpperCase()}
        </span>
      </div>

      {/* Standard attack cards — always visible */}
      <div className="text-[0.6rem] text-slate-500 uppercase tracking-widest mb-2 ml-1">Standard Attacks</div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mb-4">
        {STANDARD_ATTACKS.map((attack) => (
          <AttackCard key={attack.type} attack={attack} isSelected={selected === attack.type} onSelect={handleSelect} isAttacking={isAttacking} />
        ))}
      </div>

      {/* Sector-specific attack cards */}
      {sectorAttacks.length > 0 && (
        <>
          <div className="text-[0.6rem] text-slate-500 uppercase tracking-widest mb-2 ml-1">
            {sector} Sector Attacks
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mb-4">
            {sectorAttacks.map((attack) => (
              <AttackCard key={attack.type} attack={attack} isSelected={selected === attack.type} onSelect={handleSelect} isAttacking={isAttacking} />
            ))}
          </div>
        </>
      )}

      {/* Bottom action buttons */}
      <div className="flex gap-3">
        {!isAttacking ? (
          <>
            <button
              onClick={selected ? handleLaunchSelected : () => onLaunch('ddos')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                selected
                  ? 'bg-red-600 hover:bg-red-500 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              🚀 {selected ? `Launch ${selected.toUpperCase()}` : 'Launch All'}
            </button>
            <button
              onClick={() => onLaunch('scan')}
              className="flex-1 bg-[#0b1120] text-slate-300 border border-white/10 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5"
            >
              🔄 Recon Scan
            </button>
          </>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 bg-red-800 hover:bg-red-900 text-white py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 pulse-critical"
          >
            ⛔ Abort Attack
          </button>
        )}
      </div>
    </div>
  )
}
