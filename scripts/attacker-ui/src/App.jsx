import { useState, useRef, useCallback } from 'react'
import AttackDiagnostics from './components/AttackDiagnostics'
import ServerConfig from './components/ServerConfig'
import AttackArsenal from './components/AttackArsenal'
import ConsoleOutput from './components/ConsoleOutput'
import { runDirectAttack, runFleetAttack } from './utils/attacks'

export default function App() {
  const [targetIp, setTargetIp] = useState('http://localhost:5050')
  const [reqCount, setReqCount] = useState(100)
  const [concurrency, setConcurrency] = useState(10)
  const [sector, setSector] = useState('healthcare')
  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState({})

  const [fleetMode, setFleetMode] = useState(false)
  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:3001')
  const [fleetSector, setFleetSector] = useState('')
  const [fleetNodes, setFleetNodes] = useState([])

  const [isAttacking, setIsAttacking] = useState(false)
  const shouldStopRef = useRef(false)
  const [stats, setStats] = useState({ sent: 0, success: 0, failed: 0 })
  const [connected, setConnected] = useState(false)

  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'System initialized', type: 'system' },
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'Listening for commands...', type: 'system' },
  ])

  const addLog = useCallback((msg, type = 'system') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs((prev) => [...prev.slice(-200), { time, msg, type }])
  }, [])

  async function handlePing() {
    addLog(`Testing connection to ${targetIp}...`)
    try {
      const res = await fetch(`${targetIp}/`, { signal: AbortSignal.timeout(3000) })
      const data = await res.json()
      setConnected(true)
      addLog(`Connected: ${data.device} (${data.status})`, 'success')
    } catch (err) {
      setConnected(false)
      addLog(`Connection failed: ${err.message}`, 'error')
    }
  }

  async function fetchDevices(newSector) {
    try {
      if (newSector && newSector !== sector) {
        addLog(`Switching sector to ${newSector}...`, 'system')
        await fetch(`${targetIp}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sector: newSector }),
        })
        addLog(`Sector changed: ${newSector.toUpperCase()}`, 'success')
      }
      const res = await fetch(`${targetIp}/devices`)
      const data = await res.json()
      setDevices(data.devices || {})
      setSector(data.sector || newSector || sector)
      addLog(`Loaded ${Object.keys(data.devices || {}).length} devices`, 'success')
    } catch (err) {
      addLog(`Device fetch failed: ${err.message}`, 'error')
    }
  }

  async function fetchFleetNodes() {
    try {
      const res = await fetch(`${gatewayUrl}/nodes`, { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      if (!data.nodes || data.nodes.length === 0) {
        setFleetNodes([])
        addLog('No fleet nodes found.', 'error')
        return
      }
      setFleetNodes(data.nodes)
      const online = data.nodes.filter((n) => n.status === 'online').length
      addLog(`Fleet: ${online} nodes online`, 'success')
    } catch (err) {
      setFleetNodes([])
      addLog(`Fleet error: ${err.message}`, 'error')
    }
  }

  async function handleLaunch(type) {
    if (isAttacking) {
      addLog('Attack already running. Stop it first.', 'error')
      return
    }

    if (fleetMode) {
      if (!fleetSector) {
        addLog('Select a target node first.', 'error')
        return
      }
      addLog(`Fleet attack: ${type.toUpperCase()} → ${fleetSector.toUpperCase()} via Gateway`, 'system')
      try {
        const result = await runFleetAttack({ gatewayUrl, targetSector: fleetSector, type })
        if (result.success) {
          addLog(`Routed to ${result.nodes_targeted} node(s)`, 'success')
          result.results.forEach((r) => {
            addLog(`  ${r.node_id}: ${r.status}`, r.status === 'delivered' ? 'success' : 'error')
          })
        } else {
          addLog(`Routing failed: ${result.error}`, 'error')
        }
      } catch (err) {
        addLog(`Gateway error: ${err.message}`, 'error')
      }
      return
    }

    setIsAttacking(true)
    shouldStopRef.current = false
    setStats({ sent: 0, success: 0, failed: 0 })

    addLog(`Launching ${type.toUpperCase()} attack on ${targetIp}`, 'system')
    addLog(`Config: ${reqCount} requests, ${concurrency} threads`, 'system')

    const result = await runDirectAttack({
      type,
      target: targetIp,
      deviceId,
      reqCount,
      concurrency,
      shouldStopRef,
      onProgress: (current, total) => addLog(`Progress: ${current}/${total}`),
      onLog: addLog,
    })

    setStats({ sent: result.totalSent, success: result.successCount, failed: result.failCount })
    setIsAttacking(false)

    if (shouldStopRef.current) {
      addLog(`Stopped. Sent: ${result.totalSent}`, 'error')
    } else {
      addLog(`${type.toUpperCase()} complete.`, 'success')
      addLog(`Results: ${result.successCount} delivered / ${result.failCount} blocked`, 'system')
    }
  }

  function handleStop() {
    shouldStopRef.current = true
    addLog('Aborting attack...', 'error')
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-100">

      {/* Top Nav Bar — same structure as victim node but red */}
      <nav className="relative z-10 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-lg">
              ⚠️
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide">Attacker Node</h1>
              <p className="text-[0.65rem] text-slate-400">THREAT_OPS Security System v1.0.4</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 hidden sm:block">
              {window.location.hostname || '127.0.0.1'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              connected
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-red-400' : 'bg-slate-400'}`}
                style={{ animation: connected ? 'dot-pulse 2s infinite' : 'none' }} />
              {connected ? 'Active' : 'Standby'}
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Top metrics row */}
        <AttackDiagnostics stats={stats} isAttacking={isAttacking} />

        {/* Config + Arsenal row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <div className="lg:col-span-1">
            <ServerConfig
              targetIp={targetIp}
              setTargetIp={setTargetIp}
              sector={sector}
              setSector={setSector}
              reqCount={reqCount}
              setReqCount={setReqCount}
              concurrency={concurrency}
              setConcurrency={setConcurrency}
              deviceId={deviceId}
              setDeviceId={setDeviceId}
              devices={devices}
              onPing={handlePing}
              onFetchDevices={fetchDevices}
              connected={connected}
              fleetMode={fleetMode}
              setFleetMode={setFleetMode}
              gatewayUrl={gatewayUrl}
              setGatewayUrl={setGatewayUrl}
              fleetSector={fleetSector}
              setFleetSector={setFleetSector}
              fleetNodes={fleetNodes}
              onFetchFleetNodes={fetchFleetNodes}
              onLog={addLog}
            />
          </div>
          <div className="lg:col-span-2">
            <AttackArsenal
              onLaunch={handleLaunch}
              isAttacking={isAttacking}
              onStop={handleStop}
              sector={sector}
            />
          </div>
        </div>

        {/* Console */}
        <div className="mt-5 mb-6">
          <ConsoleOutput
            logs={logs}
            onClear={() => setLogs([{ time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: 'Console cleared.', type: 'system' }])}
          />
        </div>
      </div>
    </div>
  )
}
