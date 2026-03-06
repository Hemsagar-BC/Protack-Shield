import { useEffect, useRef } from 'react'

const VSRC = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0,1);}'
const FSRC = [
  'precision mediump float;',
  'varying vec2 v;',
  'uniform float t,ri,gs,gt,fd,vs2,gi,op,mi,mr;',
  'uniform vec2 r,mp;',
  'uniform vec3 gc;',
  'void main(){',
  '  float pi=3.14159;',
  '  vec2 uv=v*2.0-1.0;',
  '  uv.x*=r.x/r.y;',
  '  float d=length(uv);',
  '  float f=sin(pi*(t-d));',
  '  vec2 ru=uv+uv*f*ri;',
  '  if(mi>0.01){',
  '    vec2 mu=mp*2.0-1.0;mu.x*=r.x/r.y;',
  '    float md=length(uv-mu);',
  '    float inf=mi*exp(-md*md/(mr*mr));',
  '    float mw=sin(pi*(t*2.0-md*3.0))*inf;',
  '    vec2 dir=uv-mu;float dl=length(dir);',
  '    if(dl>0.001){ru+=dir/dl*mw*ri*0.3;}',
  '  }',
  '  vec2 a=sin(gs*0.5*pi*ru-pi*0.5);',
  '  vec2 b=abs(a);',
  '  vec2 sb=vec2(smoothstep(0.0,0.5,b.x),smoothstep(0.0,0.5,b.y));',
  '  vec3 col=vec3(0.0);',
  '  col+=exp(-gt*sb.x*(0.8+0.5*sin(pi*t)));',
  '  col+=exp(-gt*sb.y);',
  '  col+=0.5*exp(-gt/4.0*sin(sb.x));',
  '  col+=0.5*exp(-gt/3.0*sb.y);',
  '  col+=gi*exp(-gt*0.5*sb.x);',
  '  col+=gi*exp(-gt*0.5*sb.y);',
  '  float dd=exp(-2.0*clamp(pow(d,fd),0.0,1.0));',
  '  vec2 vc=v-0.5;float vd=length(vc);',
  '  float vn=clamp(1.0-pow(vd*2.0,vs2),0.0,1.0);',
  '  float ff=dd*vn;',
  '  float al=length(col)*ff*op;',
  '  gl_FragColor=vec4(col*gc*ff*op,al);',
  '}',
].join('\n')

function compileShader(gl, src, type) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

export default function RippleGrid({ color = [0.2, 0.05, 1.0] }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    el.appendChild(canvas)

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vsh = compileShader(gl, VSRC, gl.VERTEX_SHADER)
    const fsh = compileShader(gl, FSRC, gl.FRAGMENT_SHADER)
    if (!vsh || !fsh) return

    const pg = gl.createProgram()
    gl.attachShader(pg, vsh)
    gl.attachShader(pg, fsh)
    gl.linkProgram(pg)
    if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return
    gl.useProgram(pg)

    const pa = gl.getAttribLocation(pg, 'p')
    const bf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(pa)
    gl.vertexAttribPointer(pa, 2, gl.FLOAT, false, 0, 0)

    const uNames = ['t', 'r', 'ri', 'gs', 'gt', 'fd', 'vs2', 'gi', 'op', 'mp', 'mi', 'mr', 'gc']
    const u = {}
    uNames.forEach((n) => { u[n] = gl.getUniformLocation(pg, n) })

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, mInf = 0, curInf = 0, W = 1, H = 1
    let raf

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = el.clientWidth
      H = el.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    function onMouseMove(e) {
      tx = e.clientX / window.innerWidth
      ty = 1.0 - e.clientY / window.innerHeight
      mInf = 1.0
    }

    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', onMouseMove)
    resize()

    function draw(tm) {
      const time = tm * 0.001
      mx += (tx - mx) * 0.1
      my += (ty - my) * 0.1
      curInf += (mInf - curInf) * 0.05

      gl.uniform1f(u.t, time)
      gl.uniform2f(u.r, W, H)
      gl.uniform1f(u.ri, 0.05)
      gl.uniform1f(u.gs, 10.0)
      gl.uniform1f(u.gt, 15.0)
      gl.uniform1f(u.fd, 1.5)
      gl.uniform1f(u.vs2, 2.0)
      gl.uniform1f(u.gi, 0.1)
      gl.uniform1f(u.op, 0.8)
      gl.uniform2f(u.mp, mx, my)
      gl.uniform1f(u.mi, curInf)
      gl.uniform1f(u.mr, 1.2)
      gl.uniform3f(u.gc, color[0], color[1], color[2])

      gl.clearColor(0.051, 0.051, 0.051, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
      el.removeChild(canvas)
    }
  }, [color])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    />
  )
}
