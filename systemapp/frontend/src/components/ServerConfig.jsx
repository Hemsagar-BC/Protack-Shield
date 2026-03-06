import { useState } from 'react'

export default function ServerConfig({ serverIP, sector, onUpdate, onLog }) {
  const [ip, setIp] = useState(serverIP)
  const [sec, setSec] = useState(sector)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_ip: ip, sector: sec }),
      })
      const data = await res.json()
      if (res.ok) {
        onLog(`Target server updated: ${ip}`, 'success')
        onUpdate(ip, sec)
        localStorage.setItem('serverIP', ip)
        localStorage.setItem('sector', sec)
      } else {
        onLog(`Failed to update server: ${JSON.stringify(data)}`, 'error')
      }
    } catch (err) {
      onLog(`Error updating server: ${err}`, 'error')
    }
  }

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Server Configuration
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Ingest Endpoint</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="localhost:8001"
            className="w-full bg-[#0b1120] border border-white/10 text-blue-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Sector</label>
          <select
            value={sec}
            onChange={(e) => setSec(e.target.value)}
            className="w-full bg-[#0b1120] border border-white/10 text-blue-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2360a5fa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="healthcare">🏥 Healthcare</option>
            <option value="agriculture">🌾 Agriculture</option>
            <option value="urban">🚦 Urban</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm uppercase tracking-wider cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          Update Target
        </button>
      </form>
    </div>
  )
}
