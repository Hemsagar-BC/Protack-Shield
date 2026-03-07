import { useState } from 'react'

export default function ServerConfig({
  targetIp, setTargetIp,
  sector, setSector,
  reqCount, setReqCount,
  concurrency, setConcurrency,
  deviceId, setDeviceId,
  devices,
  onPing, onFetchDevices,
  connected,
  fleetMode, setFleetMode,
  gatewayUrl, setGatewayUrl,
  fleetSector, setFleetSector,
  fleetNodes, onFetchFleetNodes,
  onLog,
}) {

  const handleUpdate = () => {
    onFetchDevices(sector)
  }

  // Auto-fetch devices when sector changes
  const handleSectorChange = (newSector) => {
    setSector(newSector)
    onFetchDevices(newSector)
  }

  // Get status icon based on device health
  const getDeviceIcon = (device) => {
    if (!device || device.health == null) return '⚪'
    if (device.health < 50) return '🔴'
    if (device.health < 80) return '⚠️'
    return '🟢'
  }

  const deviceEntries = Object.entries(devices)

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-red-500 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Server Configuration
        </h2>
      </div>

      <div className="space-y-4">
        {/* Target Endpoint */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Target Endpoint</label>
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="http://localhost:5050"
            className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-600"
          />
        </div>

        {/* Sector + IoT Device — side by side like original HTML */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Sector</label>
            <select
              value={sector}
              onChange={(e) => handleSectorChange(e.target.value)}
              className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f87171' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="healthcare">🏥 Healthcare</option>
              <option value="agriculture">🌾 Agriculture</option>
              <option value="urban">🚦 Urban</option>
            </select>
          </div>

          {/* IoT Device Dropdown */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">IoT Device Target</label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f87171' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="">🎯 General Attack (No Device ID)</option>
              {deviceEntries.map(([id, device]) => (
                <option key={id} value={id}>
                  {getDeviceIcon(device)} {id} ({device.type || 'unknown'})
                </option>
              ))}
            </select>
            {deviceEntries.length > 0 && (
              <p className="text-[0.6rem] text-slate-500 mt-1">
                {deviceEntries.length} device{deviceEntries.length !== 1 ? 's' : ''} loaded from {sector}
              </p>
            )}
          </div>
        </div>

        {/* Update Target button */}
        <button
          onClick={handleUpdate}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium text-sm uppercase tracking-wider cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
        >
          Update Target
        </button>

        {/* Request Count & Concurrency */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Request Count</label>
            <input
              type="number"
              value={reqCount}
              min={1}
              max={10000}
              onChange={(e) => setReqCount(parseInt(e.target.value) || 100)}
              className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Concurrency</label>
            <input
              type="number"
              value={concurrency}
              min={1}
              max={100}
              onChange={(e) => setConcurrency(parseInt(e.target.value) || 10)}
              className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={onPing}
          className="w-full bg-[#0b1120] text-slate-300 border border-white/10 py-2 rounded-lg text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5"
        >
          🔌 Test Connection
        </button>
        {connected && (
          <p className="text-[0.65rem] text-emerald-400">● Target connected</p>
        )}

        {/* Fleet Mode Toggle */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300">Fleet Mode</span>
              <p className="text-[0.6rem] text-slate-500">Route through API Gateway</p>
            </div>
            <button
              onClick={() => setFleetMode((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${fleetMode ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${fleetMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Fleet config (shown when fleet mode is on) */}
        {fleetMode && (
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Gateway URL</label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="w-full bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={fleetSector}
                onChange={(e) => setFleetSector(e.target.value)}
                className="flex-1 bg-[#0b1120] border border-white/10 text-red-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-red-500/50 transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f87171' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                {fleetNodes.length === 0 ? (
                  <option value="">Click Refresh to discover</option>
                ) : (
                  fleetNodes.map((node, i) => (
                    <option key={i} value={node.sector}>
                      {node.status === 'online' ? '●' : '○'} {node.node_id} — {node.sector}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={onFetchFleetNodes}
                className="px-3 bg-[#0b1120] border border-white/10 text-slate-300 rounded-lg text-xs font-medium uppercase cursor-pointer hover:border-red-500/30 hover:text-red-400 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
