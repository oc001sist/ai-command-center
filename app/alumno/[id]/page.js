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
  const { id }   = use(params)
  const estadoId = toEstadoId(id)

  const [alumno,    setAlumno]    = useState(null)
  const [vmStatus,  setVmStatus]  = useState(null)
  const [vmLoading, setVmLoading] = useState(false)
  const [vmIp,      setVmIp]      = useState(null)
  const [dropletId, setDropletId] = useState(null)
  const [lastCommit, setLastCommit] = useState(null)
  const [toast,     setToast]     = useState({ visible: false, message: '' })
  const toastTimer = useRef(null)

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }

  async function fetchVmStatus() {
    try {
      const res  = await fetch(`/api/do/${id}/status`)
      const data = await res.json()
      if (res.ok) {
        setVmStatus(data.status || 'unknown')
        setVmIp(data.ip || null)
        setDropletId(data.dropletId || null)
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

  async function encender() {
    if (!dropletId) { showToast('❌ No se encontró el droplet'); return }
    setVmLoading(true)
    showToast('⚡ Encendiendo VM...')
    try {
      const res  = await fetch(`/api/do/${id}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropletId, action: 'power_on' }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ VM encendida — arrancando...')
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

  async function apagar() {
    if (!dropletId) { showToast('❌ No se encontró el droplet'); return }
    setVmLoading(true)
    showToast('🔴 Apagando VM...')
    try {
      const res  = await fetch(`/api/do/${id}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropletId, action: 'power_off' }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ VM apagada')
        setVmStatus('off')
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

  const isActive = vmStatus === 'active'
  const isOff    = vmStatus === 'off'

  const vmDot   = isActive ? 'var(--accent)' : isOff ? 'var(--accent2)' : 'var(--text3)'
  const vmLabel = isActive ? '● ACTIVA' : isOff ? '● APAGADA' : '● —'

  // ── Loading ────────────────────────────────────────────────────
  if (alumno === null) {
    return (
      <>
        <div className="header">
          <div>
            <div className="header-title">MI WORKSPACE</div>
            <div className="header-sub">// Cargando...</div>
          </div>
        </div>
        <div style={{ padding: '64px 32px', fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '22px' }}>
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
        <div style={{ padding: '48px 32px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '44px' }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--accent2)', marginBottom: '8px' }}>
                ID no reconocido: <strong>{estadoId}</strong>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', color: 'var(--text2)' }}>
                Verifica la URL o contacta a Marco.
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const completados = alumno.paso !== null ? alumno.paso - 1 : 0
  const tieneNotas  = alumno.notas && alumno.notas !== '-' && alumno.notas.trim() !== ''

  // ── Main ───────────────────────────────────────────────────────
  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="header-title">MI WORKSPACE</div>
          <div className="header-sub" style={{ fontSize: '16px' }}>// {alumno.nombre} · {alumno.id}</div>
        </div>
        <div className="header-status">
          <div className="status-dot" style={{ background: vmDot, width: '14px', height: '14px' }} />
          <span style={{ color: vmDot, fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{vmLabel}</span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 32px' }}>

        {/* MENSAJE DE MARCO — mostrado arriba si hay notas */}
        {tieneNotas && (
          <div style={{ marginBottom: '36px' }}>
            <div className="section-title">💬 MENSAJE DE MARCO</div>
            <div style={{
              background: 'rgba(0,255,136,0.06)',
              border: '2px solid var(--accent)',
              borderRadius: '6px',
              padding: '28px 32px',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--accent)',
                letterSpacing: '3px',
                marginBottom: '16px',
              }}>
                MARCO DICE:
              </div>
              <div style={{ fontSize: '24px', color: 'var(--text)', lineHeight: '1.65' }}>
                {alumno.notas}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESO GENERAL */}
        <div style={{
          marginBottom: '36px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '28px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--text2)', letterSpacing: '2px' }}>
              PROGRESO GENERAL
            </span>
            <span style={{ fontFamily: 'var(--font-disp)', fontSize: '52px', color: 'var(--accent)' }}>
              {completados} / 8
            </span>
          </div>
          <div className="credito-bar" style={{ height: '14px' }}>
            <div className="credito-fill high" style={{ width: `${(completados / 8) * 100}%` }} />
          </div>
        </div>

        {/* MIS PASOS */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-title">📋 MIS PASOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PASOS.map((paso, i) => {
              const n      = i + 1
              const icon   = pasoIcon(n)
              const color  = pasoColor(n)
              const actual = alumno.paso === n
              return (
                <div key={n} style={{
                  display: 'flex', alignItems: 'center', gap: '18px',
                  padding: '22px 24px',
                  background: actual ? 'rgba(0,255,136,0.06)' : 'var(--bg2)',
                  border: `1px solid ${actual ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                }}>
                  <span style={{ fontSize: '28px', minWidth: '34px', textAlign: 'center' }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text3)', minWidth: '64px' }}>
                    PASO {n}
                  </span>
                  <span style={{ fontSize: '21px', color, fontWeight: actual ? 700 : 400, flex: 1 }}>
                    {paso}
                  </span>
                  {actual && (
                    <span className="badge badge-green" style={{ fontSize: '13px', padding: '7px 16px' }}>
                      EN PROGRESO
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* MI VM */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-title">🖥️ MI VM</div>
          <div className="vm-card" style={{ borderTopColor: vmDot, borderTopWidth: '4px' }}>
            <div className="vm-spec-row" style={{ padding: '16px 0' }}>
              <span className="vm-spec-label" style={{ fontSize: '17px' }}>ESTADO</span>
              <span style={{ color: vmDot, fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {vmLabel}
              </span>
            </div>
            <div className="vm-spec-row" style={{ padding: '16px 0' }}>
              <span className="vm-spec-label" style={{ fontSize: '17px' }}>IP</span>
              <span style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                {vmIp || '—'}
              </span>
            </div>

            <div style={{ paddingTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vmLoading ? (
                <button className="btn btn-ghost" disabled style={{
                  width: '100%', padding: '26px', fontSize: '22px', letterSpacing: '2px',
                }}>
                  ⏳ PROCESANDO...
                </button>
              ) : !isActive && !isOff ? (
                <button className="btn btn-ghost" disabled style={{
                  width: '100%', padding: '26px', fontSize: '22px',
                }}>
                  ⚠ Sin conexión
                </button>
              ) : isOff ? (
                <button className="btn btn-green" onClick={encender} style={{
                  width: '100%', padding: '26px', fontSize: '22px', letterSpacing: '2px',
                }}>
                  ▶ ENCENDER VM
                </button>
              ) : (
                <button
                  className="btn btn-red btn-apagar"
                  onClick={apagar}
                  style={{
                    width: '100%',
                    padding: '30px',
                    fontSize: '26px',
                    letterSpacing: '4px',
                    fontWeight: 900,
                    background: '#ff1111',
                    border: '3px solid #ff4444',
                    color: '#fff',
                    textShadow: '0 0 12px rgba(255,255,255,0.6)',
                    borderRadius: '4px',
                  }}
                >
                  ⛔ APAGAR VM
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MI REPO */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-title">📁 MI REPO</div>
          <div className="card">
            {lastCommit === null ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '20px' }}>Cargando...</div>
            ) : lastCommit === 'norepo' ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontSize: '20px' }}>Repo aún no configurado</div>
            ) : lastCommit === 'error' ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontSize: '20px' }}>No se pudo obtener el último commit</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '17px',
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    padding: '6px 16px', borderRadius: '3px', color: 'var(--accent4)',
                  }}>
                    {lastCommit.sha}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '17px', color: 'var(--text2)' }}>
                    {lastCommit.author} · {formatDate(lastCommit.date)}
                  </span>
                </div>
                <div style={{ fontSize: '22px', color: 'var(--text)', lineHeight: '1.55' }}>
                  {lastCommit.message}
                </div>
                <a
                  href={lastCommit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ alignSelf: 'flex-start', padding: '14px 32px', fontSize: '18px' }}
                >
                  🔗 Ver en GitHub
                </a>
              </div>
            )}
          </div>
        </div>

        {/* MENSAJES DE MARCO — fallback si no hay notas */}
        {!tieneNotas && (
          <div style={{ marginBottom: '40px' }}>
            <div className="section-title">💬 MENSAJES DE MARCO</div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '42px' }}>📭</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '21px', color: 'var(--text2)' }}>
                Sin mensajes nuevos
              </span>
            </div>
          </div>
        )}

      </div>

      {/* TOAST */}
      <div className={`toast${toast.visible ? ' show' : ''}`} style={{ fontSize: '17px', padding: '18px 28px' }}>
        {toast.message}
      </div>
    </>
  )
}
