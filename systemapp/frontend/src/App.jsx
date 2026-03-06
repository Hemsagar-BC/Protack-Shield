import { useState, useEffect, useCallback, useRef } from 'react'
import SystemDiagnostics from './components/SystemDiagnostics'
import ServerConfig from './components/ServerConfig'
import VirtualIoTFleet from './components/VirtualIoTFleet'
import ConsoleOutput from './components/ConsoleOutput'

function useInterval(callback, delay) {
  const savedCallback = useRef()
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export default function App() {
  const [status, setStatus] = useState(null)
  const [health, setHealth] = useState(null)
  const [devices, setDevices] = useState({})
  const [sector, setSector] = useState(() => localStorage.getItem('sector') || 'healthcare')
  const [serverIP, setServerIP] = useState(() => localStorage.getItem('serverIP') || 'localhost:8001')
  const [selectedDevice, setSelectedDevice] = useState(() => localStorage.getItem('selectedDevice') || null)
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'System initialized', type: 'system' },
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'Listening for commands...', type: 'system' },
  ])
  const [uptime, setUptime] = useState(0)
  const [cpuHistory, setCpuHistory] = useState([])
  const [memHistory, setMemHistory] = useState([])
  const [diskHistory, setDiskHistory] = useState([])

  const addLog = useCallback((msg, type = 'system') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs((prev) => [...prev.slice(-200), { time, msg, type }])
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/status')
      const data = await res.json()
      setStatus(data)
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/health')
      const data = await res.json()
      if (!data.error) {
        setHealth(data)
        if (data.uptime_seconds) setUptime(data.uptime_seconds)
        const now = Date.now()
        setCpuHistory(prev => [...prev.slice(-59), { t: now, v: data.cpu ?? 0 }])
        setMemHistory(prev => [...prev.slice(-59), { t: now, v: data.memory ?? 0 }])
        setDiskHistory(prev => [...prev.slice(-59), { t: now, v: data.disk ?? 0 }])
      }
    } catch { /* silent */ }
  }, [])

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/devices')
      const data = await res.json()
      setDevices(data.devices || {})
      if (data.sector) setSector(data.sector)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('serverIP') || localStorage.getItem('sector')) {
      fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_ip: serverIP, sector }),
      }).catch(() => {})
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    fetchStatus()
    fetchHealth()
    fetchDevices()
  }, [fetchStatus, fetchHealth, fetchDevices])

  useInterval(fetchStatus, 5000)
  useInterval(fetchHealth, 1000)
  useInterval(fetchDevices, 3000)
  useInterval(() => setUptime((u) => u + 1), 1000)

  const healthWithUptime = health ? { ...health, uptime_seconds: uptime } : null

  const handleSelectDevice = useCallback(async (id) => {
    const newSel = selectedDevice === id ? null : id
    setSelectedDevice(newSel)
    localStorage.setItem('selectedDevice', newSel || '')
    if (newSel) {
      addLog(`Target device set: ${newSel}`, 'success')
      try {
        await fetch('/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_device: newSel }),
        })
      } catch { /* silent */ }
    } else {
      addLog('Target device cleared', 'system')
    }
  }, [selectedDevice, addLog])

  const handleHealAll = useCallback(async () => {
    try {
      const res = await fetch('/devices/heal', { method: 'POST' })
      if (res.ok) { addLog('All devices healed', 'success'); fetchDevices() }
    } catch (err) { addLog(`Failed to heal devices: ${err}`, 'error') }
  }, [addLog, fetchDevices])

  const handleResetFleet = useCallback(async () => {
    try {
      const res = await fetch('/devices/reset', { method: 'POST' })
      if (res.ok) {
        addLog('Fleet reset to defaults', 'success')
        setSelectedDevice(null)
        localStorage.removeItem('selectedDevice')
        fetchDevices()
      }
    } catch (err) { addLog(`Failed to reset fleet: ${err}`, 'error') }
  }, [addLog, fetchDevices])

  const handleConfigUpdate = useCallback((newIP, newSector) => {
    setServerIP(newIP)
    if (newSector !== sector) {
      setSector(newSector)
      setSelectedDevice(null)
      localStorage.removeItem('selectedDevice')
      addLog(`Sector changed: ${newSector.toUpperCase()}`, 'success')
      fetchDevices()
    }
  }, [sector, addLog, fetchDevices])

  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-100">

      {/* Top Nav Bar */}
      <nav className="relative z-10 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide">Victim Node</h1>
              <p className="text-[0.65rem] text-slate-400">THREAT_OPS Security System v1.0.4</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 hidden sm:block">
              {health?.device_ip || '...'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ animation: 'dot-pulse 2s infinite' }} />
              {connected ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Top metrics row */}
        <SystemDiagnostics health={healthWithUptime} status={status} cpuHistory={cpuHistory} memHistory={memHistory} diskHistory={diskHistory} />

        {/* Config + Fleet row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <div className="lg:col-span-1">
            <ServerConfig serverIP={serverIP} sector={sector} onUpdate={handleConfigUpdate} onLog={addLog} />
          </div>
          <div className="lg:col-span-2">
            <VirtualIoTFleet
              devices={devices}
              sector={sector}
              selectedDevice={selectedDevice}
              onSelectDevice={handleSelectDevice}
              onHealAll={handleHealAll}
              onResetFleet={handleResetFleet}
            />
          </div>
        </div>

        {/* Console */}
        <div className="mt-5 mb-6">
          <ConsoleOutput logs={logs} onClear={() => setLogs([{ time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'Console cleared.', type: 'system' }])} />
        </div>
      </div>
    </div>
  )
}
