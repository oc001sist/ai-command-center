'use client'

import { use, useState, useRef, useEffect } from 'react'

const PASOS = [
  'Crear cuenta GitHub',
  'Crear cuenta Vercel',
  'Clonar primer repo',
  'Primer deploy en Vercel',
  'Instalar Claude Code',
  'Primera modificación con Claude Code',
  'Conectar dominio',
  'Primer proyecto en producción',
]

function toEstadoId(urlId) {
  const u = urlId.toUpperCase()
  return u.slice(0, 2) + '-' + u.slice(2)
}

export default function AlumnoPage({ params }) {
  const { id }    = use(params)
  const estadoId  = toEstadoId(id)

  const [alumno,     setAlumno]     = useState(null)
  const [vmStatus,   setVmStatus]   = useState(null)
  const [vmLoading,  setVmLoading]  = useState(false)
  const [vmIp,       setVmIp]       = useState(null)
  const [lastCommit, setLastCommit] = useState(null)
  const [toast,      setToast]      = useState({ visible: false, message: '' })
  const toastTimer = useRef(null)

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  async function fetchVmStatus() {
    try {
      const res  = await fetch('/api/clouding/status')
      const data = await res.json()
      if (res.ok) {
        setVmStatus(data.status || 'unknown')
        setVmIp(data.ip || null)
      } else {
        setVmStatus('unknown')
      }
    } catch {
      setVmStatus('unknown')
    }
  }

  useEffect(() => {
    fetchVmStatus()
    const interval = setInterval(fetchVmStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/estado')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) { setAlumno('notfound'); return }
        const found = data.alumnos?.find(a => a.id === estadoId)
        setAlumno(found || 'notfound')
      })
      .catch(() => setAlumno('notfound'))
  }, [estadoId])

  useEffect(() => {
    if (!alumno || alumno === 'notfound') return
    if (!alumno.repo || alumno.repo === '-') { setLastCommit('norepo'); return }
    fetch(`/api/alumno/repo?repo=${encodeURIComponent(alumno.repo)}`)
      .then(r => r.json())
      .then(data => setLastCommit(data.error ? 'error' : data))
      .catch(() => setLastCommit('error'))
  }, [alumno])

  async function desarchivar() {
    setVmLoading(true)
    showToast('📦 Encendiendo servidor...')
    try {
      const res  = await fetch('/api/clouding/unarchive', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ Servidor encendido — arrancando...')
        setVmStatus('active')
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo encender'}`)
      }
    } catch {
      showToast('❌ Error de conexión')
    } finally {
      setVmLoading(false)
    }
  }

  async function archivar() {
    setVmLoading(true)
    showToast('📦 Apagando servidor...')
    try {
      const res  = await fetch('/api/clouding/archive', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ Servidor apagado')
        setVmStatus('archived')
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo apagar'}`)
      }
    } catch {
      showToast('❌ Error de conexión')
    } finally {
      setVmLoading(false)
    }
  }

  function pasoIcon(n) {
    const paso = alumno?.paso ?? null
    if (paso === null) return '⏳'
    if (n < paso)      return '✅'
    if (n === paso)    return '🔄'
    return '⏳'
  }

  function pasoColor(n) {
    const paso = alumno?.paso ?? null
    if (paso === null) return 'var(--text3)'
    if (n < paso)      return 'var(--accent4)'
    if (n === paso)    return 'var(--accent)'
    return 'var(--text3)'
  }

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const vmDot = vmStatus === 'active'
    ? 'var(--accent)'
    : vmStatus === 'archived'
    ? 'var(--accent2)'
    : 'var(--text3)'

  const vmLabel = vmStatus === 'active'
    ? '● ACTIVA'
    : vmStatus === 'archived'
    ? '● APAGADA'
    : '● —'

  // ── Loading state ──────────────────────────────────────────────
  if (alumno === null) {
    return (
      <>
        <div className="header">
          <div>
            <div className="header-title">MI WORKSPACE</div>
            <div className="header-sub">// Cargando...</div>
          </div>
        </div>
        <div style={{ padding: '48px 32px', fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '18px' }}>
          Cargando datos...
        </div>
      </>
    )
  }

  // ── Not found ──────────────────────────────────────────────────
  if (alumno === 'notfound') {
    return (
      <>
        <div className="header">
          <div>
            <div className="header-title">MI WORKSPACE</div>
            <div className="header-sub">// Alumno no encontrado</div>
          </div>
        </div>
        <div style={{ padding: '48px 32px', maxWidth: '900px', margin: '0 auto' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--accent2)', marginBottom: '6px' }}>
                ID no reconocido: <strong>{estadoId}</strong>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text2)' }}>
                Verifica la URL o contacta a Marco.
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const completados = alumno.paso !== null ? alumno.paso - 1 : 0

  // ── Main render ────────────────────────────────────────────────
  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="header-title">MI WORKSPACE</div>
          <div className="header-sub">// {alumno.nombre} · {alumno.id}</div>
        </div>
        <div className="header-status">
          <div className="status-dot" style={{ background: vmDot }} />
          <span style={{ color: vmDot }}>{vmLabel}</span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>

        {/* PROGRESO GENERAL */}
        <div style={{ marginBottom: '32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)', letterSpacing: '2px' }}>
              PROGRESO GENERAL
            </span>
            <span style={{ fontFamily: 'var(--font-disp)', fontSize: '36px', color: 'var(--accent)' }}>
              {completados} / 8
            </span>
          </div>
          <div className="credito-bar" style={{ height: '12px' }}>
            <div className="credito-fill high" style={{ width: `${(completados / 8) * 100}%` }} />
          </div>
        </div>

        {/* MIS PASOS */}
        <div style={{ marginBottom: '36px' }}>
          <div className="section-title">📋 MIS PASOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PASOS.map((paso, i) => {
              const n      = i + 1
              const icon   = pasoIcon(n)
              const color  = pasoColor(n)
              const actual = alumno.paso === n
              return (
                <div key={n} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 20px',
                  background: actual ? 'rgba(0,255,136,0.06)' : 'var(--bg2)',
                  border: `1px solid ${actual ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                }}>
                  <span style={{ fontSize: '22px', minWidth: '28px', textAlign: 'center' }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text3)', minWidth: '56px' }}>
                    PASO {n}
                  </span>
                  <span style={{ fontSize: '18px', color, fontWeight: actual ? 700 : 400, flex: 1 }}>
                    {paso}
                  </span>
                  {actual && <span className="badge badge-green">EN PROGRESO</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* MI VM */}
        <div style={{ marginBottom: '36px' }}>
          <div className="section-title">🖥️ MI VM</div>
          <div className="vm-card" style={{ borderTopColor: vmDot }}>
            <div className="vm-spec-row">
              <span className="vm-spec-label">ESTADO</span>
              <span className="vm-spec-value" style={{ color: vmDot, fontSize: '18px' }}>{vmLabel}</span>
            </div>
            <div className="vm-spec-row">
              <span className="vm-spec-label">IP</span>
              <span className="vm-spec-value" style={{ fontSize: '18px' }}>{vmIp || '—'}</span>
            </div>
            <div style={{ paddingTop: '20px' }}>
              {vmLoading ? (
                <button className="btn btn-ghost" disabled style={{ width: '100%', padding: '18px', fontSize: '17px' }}>⏳ Procesando...</button>
              ) : vmStatus === 'archived' ? (
                <button className="btn btn-green" onClick={desarchivar} style={{ width: '100%', padding: '18px', fontSize: '17px' }}>▶ ENCENDER VM</button>
              ) : vmStatus === 'active' ? (
                <button className="btn btn-red" onClick={archivar} style={{ width: '100%', padding: '18px', fontSize: '17px' }}>⛔ APAGAR VM</button>
              ) : vmStatus === null ? (
                <button className="btn btn-ghost" disabled style={{ width: '100%', padding: '18px', fontSize: '17px' }}>⏳ Cargando estado...</button>
              ) : (
                <button className="btn btn-ghost" disabled style={{ width: '100%', padding: '18px', fontSize: '17px' }}>⚠ Sin conexión</button>
              )}
            </div>
          </div>
        </div>

        {/* MI REPO */}
        <div style={{ marginBottom: '36px' }}>
          <div className="section-title">📁 MI REPO</div>
          <div className="card">
            {lastCommit === null ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '16px' }}>Cargando...</div>
            ) : lastCommit === 'norepo' ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '16px' }}>Repo aún no configurado</div>
            ) : lastCommit === 'error' ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontSize: '16px' }}>No se pudo obtener el último commit</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '14px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    padding: '4px 12px', borderRadius: '3px', color: 'var(--accent4)',
                  }}>
                    {lastCommit.sha}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text2)' }}>
                    {lastCommit.author} · {formatDate(lastCommit.date)}
                  </span>
                </div>
                <div style={{ fontSize: '19px', color: 'var(--text)', lineHeight: '1.5' }}>
                  {lastCommit.message}
                </div>
                <a
                  href={lastCommit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ alignSelf: 'flex-start', padding: '12px 28px', fontSize: '16px' }}
                >
                  🔗 Ver en GitHub
                </a>
              </div>
            )}
          </div>
        </div>

        {/* MENSAJES DE MARCO */}
        <div style={{ marginBottom: '36px' }}>
          <div className="section-title">💬 MENSAJES DE MARCO</div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '36px' }}>📭</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--text2)' }}>
              Sin mensajes nuevos
            </span>
          </div>
        </div>

      </div>

      {/* TOAST */}
      <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.message}</div>
    </>
  )
}
