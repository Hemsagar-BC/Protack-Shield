// Attack payload generators
export function getAttackPayload(type) {
  const payloads = {
    sql: { query: "SELECT * FROM users WHERE 1=1 OR password LIKE '%'" },
    brute: { username: `admin_${Math.floor(Math.random() * 1000)}`, password: 'password123' },
    ddos: { rate: 10000 },
    healthcare: { sensor_data: [1024, 5000, 100, 100] },
    agriculture: { sensor_data: [100, 0, 0, 255, 255, 255] },
    urban: { sensor_data: [500, 5] },
    cctv: { attack_type: 'feed_tampering' },
  }
  return payloads[type] || {}
}

// SQL injection payloads rotation
export function getSqlPayload(index) {
  const payloads = [
    `SELECT * FROM users WHERE id=${1000 + index} OR 1=1 --`,
    `admin' --`,
    `UNION SELECT 1, 'admin', password FROM users --`,
    `1'; DROP TABLE users --`,
    `' OR '1'='1`,
  ]
  return payloads[index % payloads.length]
}

// CCTV attack types rotation
export function getCctvAttackType(index) {
  const types = ['feed_tampering', 'camera_disable', 'unauthorized_access']
  return types[index % types.length]
}
