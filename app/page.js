'use client'

import { useState, useRef, useEffect } from 'react'

const ESTADOS = {
  'contab-alertacamaron': {
    ultimo: 'Claude Code',
    fecha: '25 mayo 2026',
    intento: 'Implementar login redirect después de autenticación',
    resultado: 'Falla en redirección post-login. useNavigate no redirige, window.location tampoco.',
    no_tocar: 'auth.js — la autenticación funciona correctamente',
    siguiente: 'Probar con React Router loader o wrapper de ruta protegida',
    repo: 'github.com/mrjuarez1contactos/CONTAB-ALERTACAMARON',
  },
  'pcv001-chat': {
    ultimo: 'Claude',
    fecha: '23 abril 2026',
    intento: 'Chat conectado a Supermemory con proxy Vercel',
    resultado: 'Funcionando correctamente. CORS resuelto.',
    no_tocar: 'api/search.js — proxy funcionando',
    siguiente: 'Agregar más documentos al container pcv-001-configuracion',
    repo: 'github.com/mrjuarez1contactos/pcv001-chat',
  },
  'whatsapp-agent': {
    ultimo: 'Claude',
    fecha: '20 mayo 2026',
    intento: 'Agente lector de WhatsApp en VM Clouding.io',
    resultado: 'Mensajes capturados y enviados a Supabase correctamente.',
    no_tocar: 'index.js del agente — funcionando',
    siguiente: 'Definir siguiente feature del agente',
    repo: 'VM Clouding.io: whatsapp-agent-01',
  },
}

const CONSEJOS = {
  claude: 'Pega este contexto al inicio de tu conversación con Claude. Luego describe el problema específico.',
  gemini: 'Pega en Gemini. Funciona bien para analizar archivos — también adjunta los archivos del repo si puedes.',
  deepseek: 'Pega en chat.deepseek.com — es muy bueno con errores de código. Ve directo al punto.',
  lovable: 'En Lovable usa "Edit with AI" — pega el contexto y describe el cambio visual que necesitas.',
  manus: 'Manus puede leer el repo directo de GitHub. Pega el contexto y dale el link del repo.',
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [modal, setModal] = useState({ open: false, type: '', param: '' })
  const [dispatchRepo, setDispatchRepo] = useState('')
  const [dispatchIA, setDispatchIA] = useState('')
  const [contextText, setContextText] = useState('')
  const [contextVisible, setContextVisible] = useState(false)
  const toastTimer = useRef(null)

  const FALLBACK_ACTIVIDAD = [
    { time: 'hace 2h',  color: 'var(--accent)',  text: 'Abelardo completó paso 3 — instalación Node.js en VM' },
    { time: 'hace 5h',  color: 'var(--accent)',  text: 'ESTADO.md actualizado — repo contab-alertacamaron' },
    { time: 'hace 1d',  color: 'var(--accent3)', text: 'Carlos creó VM en Clouding.io — €5.00 crédito inicial' },
    { time: 'hace 2d',  color: 'var(--text3)',   text: 'Proyecto OC-005 generó primer ingreso: $5.00' },
  ]

  const FALLBACK_VMS = [
    { name: 'OC-005 Abelardo',   credit: '€3.40', color: 'var(--accent)',  fill: 'high', pct: '68%' },
    { name: 'OC-006 Carlos',     credit: '€1.20', color: 'var(--accent2)', fill: 'low',  pct: '24%' },
    { name: 'OC-001 Marco (yo)', credit: '€2.80', color: 'var(--accent3)', fill: 'mid',  pct: '56%' },
  ]

  const [actividadReciente, setActividadReciente] = useState(FALLBACK_ACTIVIDAD)
  const [vmsData, setVmsData] = useState(FALLBACK_VMS)
  const [vmStatus, setVmStatus]   = useState(null)
  const [vmLoading, setVmLoading] = useState(false)
  const [vmBalance, setVmBalance] = useState(null)
  const [doStatus, setDoStatus]   = useState(null)
  const [doLoading, setDoLoading] = useState(false)
  const [doDropletId, setDoDropletId] = useState(null)
  const [doIp, setDoIp] = useState(null)

  useEffect(() => {
    fetch('/api/estado')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) return
        if (data.actividad?.length) {
          const colors = ['var(--accent)', 'var(--accent)', 'var(--accent3)', 'var(--text3)']
          setActividadReciente(data.actividad.map((item, i) => ({
            ...item,
            color: colors[i] ?? 'var(--text3)',
          })))
        }
        if (data.vms?.length) {
          setVmsData(data.vms.map(vm => {
            const amount = parseFloat((vm.credit || '0').replace(/[^0-9.]/g, ''))
            const pct = Math.min(100, Math.round((amount / 5) * 100)) + '%'
            const fill = amount > 3 ? 'high' : amount > 1.5 ? 'mid' : 'low'
            const color = amount > 3 ? 'var(--accent)' : amount > 1.5 ? 'var(--accent3)' : 'var(--accent2)'
            return { name: `${vm.id} ${vm.alumno}`, credit: vm.credit, color, fill, pct }
          }))
        }
      })
      .catch(() => {})
  }, [])

  async function fetchVmStatus() {
    try {
      const res  = await fetch('/api/clouding/status')
      const data = await res.json()
      setVmStatus(res.ok ? (data.status || 'unknown') : 'unknown')
    } catch {
      setVmStatus('unknown')
    }
  }

  useEffect(() => {
    fetchVmStatus()
    const interval = setInterval(fetchVmStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDoStatus() {
    try {
      const res  = await fetch('/api/digitalocean/droplets')
      const data = await res.json()
      if (!res.ok || !data.droplets) { setDoStatus('unknown'); return }
      const droplet = data.droplets.find(d => d.name === 'oc002sist-vm-01')
      if (!droplet) { setDoStatus('unknown'); return }
      setDoDropletId(droplet.id)
      setDoIp(droplet.ip)
      setDoStatus(droplet.status === 'active' ? 'active' : 'off')
    } catch {
      setDoStatus('unknown')
    }
  }

  useEffect(() => {
    fetchDoStatus()
    const interval = setInterval(fetchDoStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchVmBalance() {
    try {
      const res  = await fetch('/api/clouding/balance')
      const data = await res.json()
      setVmBalance(res.ok && data.balance !== null ? data.balance : 'error')
    } catch {
      setVmBalance('error')
    }
  }

  useEffect(() => {
    fetchVmBalance()
    const interval = setInterval(fetchVmBalance, 60000)
    return () => clearInterval(interval)
  }, [])

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  async function desarchivar() {
    setVmLoading(true)
    showToast('📦 Enviando orden de desarchivar servidor en Clouding.io...')
    try {
      const res  = await fetch('/api/clouding/unarchive', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ Servidor desarchivado — arrancando...')
        setVmStatus('active')
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo desarchivar'}`)
      }
    } catch {
      showToast('❌ Error de conexión con la API')
    } finally {
      setVmLoading(false)
    }
  }

  async function archivar() {
    setVmLoading(true)
    showToast('📦 Enviando orden de archivar servidor en Clouding.io...')
    try {
      const res  = await fetch('/api/clouding/archive', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('✅ Servidor archivado — crédito detenido')
        setVmStatus('archived')
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo archivar'}`)
      }
    } catch {
      showToast('❌ Error de conexión con la API')
    } finally {
      setVmLoading(false)
    }
  }

  async function apagar(code) {
    showToast(`⛔ Enviando orden de apagado a VM ${code} en Clouding.io...`)
    try {
      const res = await fetch('/api/clouding/poweroff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: code }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`✅ VM ${code} apagada — crédito detenido`)
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo apagar la VM'}`)
      }
    } catch {
      showToast('❌ Error de conexión con la API')
    }
  }

  async function doTogglePower() {
    if (!doDropletId) { showToast('⚠️ No se encontró el droplet oc002sist-vm-01'); return }
    const action = doStatus === 'active' ? 'power_off' : 'power_on'
    setDoLoading(true)
    showToast(action === 'power_off' ? '⛔ Apagando droplet en DigitalOcean...' : '▶ Encendiendo droplet en DigitalOcean...')
    try {
      const res  = await fetch('/api/digitalocean/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropletId: doDropletId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(action === 'power_off' ? '✅ Droplet apagado' : '✅ Droplet encendido — arrancando...')
        setDoStatus(action === 'power_off' ? 'off' : 'active')
      } else {
        showToast(`❌ Error: ${data.error || 'No se pudo ejecutar la acción'}`)
      }
    } catch {
      showToast('❌ Error de conexión con la API')
    } finally {
      setDoLoading(false)
    }
  }

  function copyKey(key) {
    navigator.clipboard.writeText(key).catch(() => {})
    showToast('✅ API key copiada al portapapeles')
  }

  function verPasos(nombre) {
    showToast(`📋 Abriendo pasos de ${nombre}...`)
  }

  function despacharRepo(repo) {
    setActiveSection('despachar')
    setDispatchRepo(repo)
  }

  function generarContexto() {
    if (!dispatchRepo || !dispatchIA) {
      showToast('⚠️ Selecciona repo e IA primero')
      return
    }
    const e = ESTADOS[dispatchRepo] || {}
    const consejo = CONSEJOS[dispatchIA] || ''
    const texto = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'ESTADO DEL PROYECTO — PEGA ESTO PRIMERO',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `PROYECTO:        ${dispatchRepo}`,
      `REPO:            ${e.repo || '—'}`,
      `ÚLTIMA IA:       ${e.ultimo || '—'}`,
      `FECHA:           ${e.fecha || '—'}`,
      '',
      `QUÉ SE INTENTÓ:  ${e.intento || '—'}`,
      `RESULTADO:       ${e.resultado || '—'}`,
      `NO TOCAR:        ${e.no_tocar || '—'}`,
      `SIGUIENTE PASO:  ${e.siguiente || '—'}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `💡 CONSEJO PARA ${dispatchIA.toUpperCase()}: ${consejo}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n')
    setContextText(texto)
    setContextVisible(true)
    showToast(`✅ Contexto generado — cópialo y pégalo en ${dispatchIA}`)
  }

  function copiarContexto() {
    navigator.clipboard.writeText(contextText).catch(() => {})
    showToast('📋 Contexto copiado — pégalo en tu IA')
  }

  function showModal(tipo, param) {
    setModal({ open: true, type: tipo, param })
  }

  function closeModal() {
    setModal({ open: false, type: '', param: '' })
    showToast('✅ Guardado correctamente')
  }

  function getModalTitle() {
    const { type, param } = modal
    if (type === 'editKey') return `EDITAR KEY — ${param.toUpperCase()}`
    if (type === 'addIA') return 'AGREGAR NUEVA IA'
    if (type === 'addRepo') return 'AGREGAR REPO'
    if (type === 'migrar') return `MIGRAR — ${param.toUpperCase()}`
    if (type === 'nuevaVM') return 'CREAR NUEVA VM EN CLOUDING.IO'
    if (type === 'addAlumno') return 'NUEVO ALUMNO'
    return '—'
  }

  function ModalBody() {
    const { type, param } = modal
    if (type === 'editKey') return (
      <div className="form-group">
        <label className="form-label">Nueva API Key</label>
        <input type="password" className="form-input" placeholder="Pega aquí la nueva key..." style={{ width: '100%' }} />
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
          ⚠️ La key se guardará en tu Google Drive de forma segura.
        </div>
      </div>
    )
    if (type === 'addIA') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input type="text" className="form-input" placeholder="Ej: ChatGPT" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Link Dashboard</label>
          <input type="text" className="form-input" placeholder="https://..." style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">API Key (opcional)</label>
          <input type="password" className="form-input" placeholder="sk-..." style={{ width: '100%' }} />
        </div>
      </div>
    )
    if (type === 'addRepo') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Nombre del repo</label>
          <input type="text" className="form-input" placeholder="Ej: mi-proyecto" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">URL GitHub</label>
          <input type="text" className="form-input" placeholder="github.com/mrjuarez1contactos/..." style={{ width: '100%' }} />
        </div>
      </div>
    )
    if (type === 'migrar') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.6' }}>
          Este proyecto está maduro y listo para migrar a una VM más estable. Elige el destino:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { value: 'hetzner', label: 'Hetzner — €4/mes · recomendado' },
            { value: 'digitalocean', label: 'DigitalOcean — $6/mes' },
            { value: 'clouding', label: 'Seguir en Clouding.io' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}>
              <input type="radio" name="destino" value={opt.value} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--accent3)', fontFamily: 'var(--font-mono)', padding: '10px', background: 'rgba(255,170,0,0.08)', borderRadius: '3px' }}>
          ⚠️ La migración crea una nueva VM en el destino. El ESTADO.md se copia automáticamente.
        </div>
      </div>
    )
    if (type === 'nuevaVM') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Nombre de la VM</label>
          <input type="text" className="form-input" placeholder="Ej: alumno-abelardo-01" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Para quién</label>
          <select className="form-select" style={{ width: '100%' }}>
            <option>OC-001 Marco (yo)</option>
            <option>OC-005 Abelardo</option>
            <option>OC-006 Carlos</option>
            <option>— Nuevo alumno —</option>
          </select>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)', padding: '12px', background: 'var(--bg3)', borderRadius: '3px', lineHeight: '1.8' }}>
          SO: Windows Server 2022<br />
          Image ID: Lka79zd4JDnxyr85<br />
          Crédito inicial: €5.00 gratis<br />
          Tiempo de creación: ~30 segundos
        </div>
      </div>
    )
    if (type === 'addAlumno') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input type="text" className="form-input" placeholder="Ej: Abelardo" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Código (auto)</label>
          <input type="text" className="form-input" defaultValue="OC-007" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Proyecto a construir</label>
          <input type="text" className="form-input" placeholder="Ej: tienda de plantas" style={{ width: '100%' }} />
        </div>
        <div style={{ fontSize: '14px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', padding: '12px', background: 'var(--bg3)', borderRadius: '3px' }}>
          ✅ Se creará automáticamente: carpeta en Drive + VM en Clouding.io con €5 de crédito
        </div>
      </div>
    )
    return null
  }

  const S = (name) => `section${activeSection === name ? ' active' : ''}`

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div>
          <div className="header-title">AI COMMAND CENTER</div>
          <div className="header-sub">// Panel de control — Marco Juárez</div>
        </div>
        <div className="header-status">
          <div className="status-dot" />
          SISTEMA ACTIVO
        </div>
      </div>

      {/* NAV */}
      <div className="nav">
        {[
          ['dashboard', '📊 DASHBOARD'],
          ['ias',       '🤖 MIS IAs'],
          ['repos',     '📁 REPOS'],
          ['alumnos',   '👤 ALUMNOS'],
          ['despachar', '🚀 DESPACHAR'],
          ['mivm',      '🖥️ MI VM'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`nav-tab${activeSection === id ? ' active' : ''}`}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="main">

        {/* ======= DASHBOARD ======= */}
        <div className={S('dashboard')}>
          <div className="alert-banner">
            ⚠️ ALERTA: Abelardo (OC-005) lleva 48h sin avanzar. Último paso completado: paso 3 de 8.
          </div>
          <div className="alert-banner yellow">
            💰 Crédito bajo: VM de Carlos (OC-006) tiene solo €1.20 restantes.
          </div>

          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-label">Alumnos activos</div>
              <div className="stat-value blue">3</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Repos en progreso</div>
              <div className="stat-value yellow">5</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">IAs conectadas</div>
              <div className="stat-value green">6</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Ingresos este mes</div>
              <div className="stat-value green">$47</div>
            </div>
          </div>

          <div className="section-title">ACTIVIDAD RECIENTE</div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title"><span className="card-title-icon">🕐</span> ÚLTIMAS ACCIONES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {actividadReciente.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: item.color, fontFamily: 'var(--font-mono)', fontSize: '12px', whiteSpace: 'nowrap', marginTop: '2px' }}>{item.time}</span>
                    <span style={{ fontSize: '15px', color: 'var(--text2)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title"><span className="card-title-icon">🖥️</span> VMs CLOUDING.IO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {vmsData.map((vm, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>{vm.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: vm.color }}>{vm.credit}</span>
                    </div>
                    <div className="credito-bar"><div className={`credito-fill ${vm.fill}`} style={{ width: vm.pct }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======= IAs ======= */}
        <div className={S('ias')}>
          <div className="section-title">MIS IAs</div>
          <div className="grid-auto">
            {[
              { emoji: '🟣', name: 'CLAUDE',     badge: 'badge-green', badgeText: 'ACTIVO',     desc: 'Arquitectura, análisis complejo, documentación, código largo.',    key: 'sk-ant-••••••••••XjK9', href: 'https://claude.ai' },
              { emoji: '🔵', name: 'GEMINI',     badge: 'badge-green', badgeText: 'ACTIVO',     desc: 'Análisis de documentos, búsqueda, Google Workspace integrado.',    key: 'AIzaSy••••••••••m8Q',   href: 'https://gemini.google.com' },
              { emoji: '🟢', name: 'PERPLEXITY', badge: 'badge-green', badgeText: 'ACTIVO',     desc: 'Búsqueda web en tiempo real, investigación, precios actuales.',    key: 'pplx-••••••••••9aR',    href: 'https://perplexity.ai' },
            ].map(ia => (
              <div key={ia.name} className="ia-card">
                <div className="ia-header">
                  <span className="ia-emoji">{ia.emoji}</span>
                  <div>
                    <div className="ia-name">{ia.name}</div>
                    <span className={`badge ${ia.badge}`}>{ia.badgeText}</span>
                  </div>
                </div>
                <div className="ia-desc">{ia.desc}</div>
                <div className="ia-key" onClick={() => copyKey(ia.key)}>
                  <span className="ia-key-text">API: {ia.key}</span>
                  <span>📋</span>
                </div>
                <div className="ia-buttons">
                  <a href={ia.href} target="_blank" rel="noreferrer" className="btn btn-outline">🌐 Dashboard</a>
                  <button className="btn btn-ghost" onClick={() => showModal('editKey', ia.name)}>✏️ Editar Key</button>
                </div>
              </div>
            ))}

            <div className="ia-card">
              <div className="ia-header">
                <span className="ia-emoji">⚫</span>
                <div>
                  <div className="ia-name">MANUS</div>
                  <span className="badge badge-yellow">SIN KEY</span>
                </div>
              </div>
              <div className="ia-desc">Tareas largas automáticas, agente multi-paso, investigación profunda.</div>
              <div className="ia-key" style={{ color: 'var(--text3)' }}>
                <span className="ia-key-text">API: no configurada</span>
                <span>➕</span>
              </div>
              <div className="ia-buttons">
                <a href="https://manus.im" target="_blank" rel="noreferrer" className="btn btn-outline">🌐 Dashboard</a>
                <button className="btn btn-yellow" onClick={() => showModal('editKey', 'Manus')}>+ Agregar Key</button>
              </div>
            </div>

            <div className="ia-card">
              <div className="ia-header">
                <span className="ia-emoji">🔴</span>
                <div>
                  <div className="ia-name">DEEPSEEK</div>
                  <span className="badge badge-gray">DISPONIBLE</span>
                </div>
              </div>
              <div className="ia-desc">IA china — muy buena para código. Alternativa cuando otros fallan.</div>
              <div className="ia-key" style={{ color: 'var(--text3)' }}>
                <span className="ia-key-text">API: no configurada</span>
                <span>➕</span>
              </div>
              <div className="ia-buttons">
                <a href="https://chat.deepseek.com" target="_blank" rel="noreferrer" className="btn btn-outline">🌐 Dashboard</a>
                <button className="btn btn-yellow" onClick={() => showModal('editKey', 'DeepSeek')}>+ Agregar Key</button>
              </div>
            </div>

            <div className="ia-card">
              <div className="ia-header">
                <span className="ia-emoji">🟡</span>
                <div>
                  <div className="ia-name">LOVABLE</div>
                  <span className="badge badge-blue">UI/DISEÑO</span>
                </div>
              </div>
              <div className="ia-desc">Interfaces rápidas, componentes React, diseño visual automático.</div>
              <div className="ia-key" style={{ color: 'var(--text3)' }}>
                <span className="ia-key-text">Acceso por dashboard</span>
                <span>🌐</span>
              </div>
              <div className="ia-buttons">
                <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="btn btn-green">🌐 Abrir Lovable</a>
              </div>
            </div>
          </div>

          <div className="sep" />
          <button className="btn btn-outline" onClick={() => showModal('addIA', '')}>➕ AGREGAR NUEVA IA</button>
        </div>

        {/* ======= REPOS ======= */}
        <div className={S('repos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="section-title" style={{ marginBottom: 0, flex: 1 }}>MIS REPOS</div>
            <button className="btn btn-green" onClick={() => showModal('addRepo', '')}>➕ NUEVO REPO</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="repo-card error">
              <div className="repo-header">
                <div>
                  <div className="repo-name">📁 contab-alertacamaron</div>
                  <div className="repo-ia">Última IA: Claude Code · hace 3h</div>
                </div>
                <span className="badge badge-red">ERROR</span>
              </div>
              <div className="repo-estado">
                <strong>⚠️ Problema actual:</strong> Login redirect no funciona después de autenticación.<br />
                auth.js funciona ✓ — NO tocar.<br />
                Intentado: redirect manual, useNavigate hook, window.location — todos fallan.<br />
                Siguiente: probar con React Router loader.
              </div>
              <div className="fase-strip">
                <div className="fase-step done">✓ IDEA</div>
                <div className="fase-step done">✓ CODING</div>
                <div className="fase-step actual">⚡ ERRORES</div>
                <div className="fase-step next">→ STAGING</div>
                <div className="fase-step">PRODUCCIÓN</div>
                <div className="fase-step">MIGRAR VM</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                🔗 github.com/mrjuarez1contactos/CONTAB-ALERTACAMARON · 🌐 contab-alertacamaron.vercel.app
              </div>
              <div className="repo-actions">
                <a href="https://github.com/mrjuarez1contactos/CONTAB-ALERTACAMARON" target="_blank" rel="noreferrer" className="btn btn-outline">GitHub</a>
                <button className="btn btn-ghost">Ver ESTADO.md</button>
                <button className="btn btn-red" style={{ fontSize: '13px', padding: '10px 16px' }} onClick={() => despacharRepo('contab-alertacamaron')}>🚀 Despachar a IA</button>
              </div>
            </div>

            <div className="repo-card active-work">
              <div className="repo-header">
                <div>
                  <div className="repo-name">📁 pcv001-chat</div>
                  <div className="repo-ia">Última IA: Claude · hace 1d</div>
                </div>
                <span className="badge badge-green">ACTIVO</span>
              </div>
              <div className="repo-estado">
                Funcionando ✓ · Chat conectado a Supermemory via proxy Vercel.<br />
                CORS resuelto. Próximo: agregar más documentos al container pcv-001-configuracion.
              </div>
              <div className="fase-strip">
                <div className="fase-step done">✓ IDEA</div>
                <div className="fase-step done">✓ CODING</div>
                <div className="fase-step done">✓ ERRORES</div>
                <div className="fase-step actual">⚡ STAGING</div>
                <div className="fase-step next">→ PRODUCCIÓN</div>
                <div className="fase-step">MIGRAR VM</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                🔗 github.com/mrjuarez1contactos/pcv001-chat · 🌐 pcv001-chat.vercel.app
              </div>
              <div className="repo-actions">
                <a href="https://github.com/mrjuarez1contactos" target="_blank" rel="noreferrer" className="btn btn-outline">GitHub</a>
                <button className="btn btn-ghost">Ver ESTADO.md</button>
                <button className="btn btn-blue" onClick={() => despacharRepo('pcv001-chat')}>🚀 Despachar a IA</button>
              </div>
            </div>

            <div className="repo-card paused">
              <div className="repo-header">
                <div>
                  <div className="repo-name">📁 whatsapp-agent</div>
                  <div className="repo-ia">Última IA: Claude · hace 5d</div>
                </div>
                <span className="badge badge-yellow">PAUSADO</span>
              </div>
              <div className="repo-estado">
                Agente WhatsApp funcionando en VM Clouding.io ✓<br />
                Mensajes capturados y enviados a Supabase ✓<br />
                Pausado: esperando definir siguiente feature.
              </div>
              <div className="fase-strip">
                <div className="fase-step done">✓ IDEA</div>
                <div className="fase-step done">✓ CODING</div>
                <div className="fase-step done">✓ ERRORES</div>
                <div className="fase-step done">✓ STAGING</div>
                <div className="fase-step actual">⚡ PRODUCCIÓN</div>
                <div className="fase-step next">→ MIGRAR VM</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', padding: '10px 14px', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: '3px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent3)' }}>Listo para migrar — de Clouding.io a VM más estable y económica</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                🖥️ VM Clouding.io: whatsapp-agent-01
              </div>
              <div className="repo-actions">
                <button className="btn btn-outline">Ver ESTADO.md</button>
                <button className="btn btn-yellow" onClick={() => showModal('migrar', 'whatsapp-agent')}>📦 Planear migración</button>
                <button className="btn btn-yellow" onClick={() => despacharRepo('whatsapp-agent')}>🚀 Despachar a IA</button>
              </div>
            </div>
          </div>
        </div>

        {/* ======= ALUMNOS ======= */}
        <div className={S('alumnos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="section-title" style={{ marginBottom: 0, flex: 1 }}>MIS ALUMNOS</div>
            <button className="btn btn-green" onClick={() => showModal('addAlumno', '')}>➕ NUEVO ALUMNO</button>
          </div>

          <div className="grid-auto">
            <div className="alumno-card">
              <div className="alumno-header">
                <div>
                  <div className="alumno-name">ABELARDO</div>
                  <div className="alumno-code">OC-005 · abelardo@gmail.com</div>
                </div>
                <span className="badge badge-yellow">TRABADO</span>
              </div>
              <div className="alumno-body">
                <div className="alumno-row">
                  <span className="alumno-row-label">PROYECTO</span>
                  <span className="alumno-row-value">App de inventario</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">PROGRESO</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent3)' }}>Paso 3 de 8</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">ÚLTIMO AVANCE</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent2)' }}>hace 48h</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">INGRESOS MES</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent)' }}>$5.00</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="alumno-row-label">CRÉDITO VM</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent)' }}>€3.40</span>
                  </div>
                  <div className="credito-bar"><div className="credito-fill high" style={{ width: '68%' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => verPasos('Abelardo')}>📋 Ver pasos</button>
                  <button className="btn btn-ghost" onClick={() => apagar('OC-005')}>⛔ Apagar VM</button>
                </div>
              </div>
            </div>

            <div className="alumno-card">
              <div className="alumno-header">
                <div>
                  <div className="alumno-name">CARLOS</div>
                  <div className="alumno-code">OC-006 · carlos@gmail.com</div>
                </div>
                <span className="badge badge-red">CRÉDITO BAJO</span>
              </div>
              <div className="alumno-body">
                <div className="alumno-row">
                  <span className="alumno-row-label">PROYECTO</span>
                  <span className="alumno-row-value">Blog de recetas</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">PROGRESO</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent)' }}>Paso 6 de 8</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">ÚLTIMO AVANCE</span>
                  <span className="alumno-row-value">hace 2h</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">INGRESOS MES</span>
                  <span className="alumno-row-value" style={{ color: 'var(--text2)' }}>$0.00</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="alumno-row-label">CRÉDITO VM</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent2)' }}>€1.20 ⚠️</span>
                  </div>
                  <div className="credito-bar"><div className="credito-fill low" style={{ width: '24%' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => verPasos('Carlos')}>📋 Ver pasos</button>
                  <button className="btn btn-red" onClick={() => apagar('OC-006')}>⛔ APAGAR VM</button>
                </div>
              </div>
            </div>

            <div className="alumno-card">
              <div className="alumno-header">
                <div>
                  <div className="alumno-name">MARCO (YO)</div>
                  <div className="alumno-code">OC-001 · marco@gmail.com</div>
                </div>
                <span className="badge badge-green">ACTIVO</span>
              </div>
              <div className="alumno-body">
                <div className="alumno-row">
                  <span className="alumno-row-label">PROYECTO</span>
                  <span className="alumno-row-value">AI Command Center</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">PROGRESO</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent)' }}>En construcción</span>
                </div>
                <div className="alumno-row">
                  <span className="alumno-row-label">INGRESOS MES</span>
                  <span className="alumno-row-value" style={{ color: 'var(--accent)' }}>$42.00</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="alumno-row-label">CRÉDITO VM</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent3)' }}>€2.80</span>
                  </div>
                  <div className="credito-bar"><div className="credito-fill mid" style={{ width: '56%' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }}>📋 Ver proyectos</button>
                  <button className="btn btn-ghost" onClick={() => apagar('OC-001')}>⛔ Apagar VM</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======= DESPACHAR ======= */}
        <div className={S('despachar')}>
          <div className="section-title">DESPACHAR TRABAJO A IA</div>
          <div className="dispatch-box">
            <div className="dispatch-row">
              <div className="form-group">
                <label className="form-label">Repositorio</label>
                <select className="form-select" value={dispatchRepo} onChange={e => setDispatchRepo(e.target.value)}>
                  <option value="">— Selecciona repo —</option>
                  <option value="contab-alertacamaron">contab-alertacamaron (ERROR: login)</option>
                  <option value="pcv001-chat">pcv001-chat (ACTIVO)</option>
                  <option value="whatsapp-agent">whatsapp-agent (PAUSADO)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">IA a usar</label>
                <select className="form-select" value={dispatchIA} onChange={e => setDispatchIA(e.target.value)}>
                  <option value="">— Selecciona IA —</option>
                  <option value="claude">Claude (análisis complejo)</option>
                  <option value="gemini">Gemini (documentos)</option>
                  <option value="deepseek">DeepSeek (código alternativo)</option>
                  <option value="lovable">Lovable (UI/diseño)</option>
                  <option value="manus">Manus (tareas largas)</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 0 }}>
                <label className="form-label">&nbsp;</label>
                <button className="btn btn-green" style={{ padding: '12px 28px', fontSize: '16px' }} onClick={generarContexto}>
                  🚀 GENERAR CONTEXTO
                </button>
              </div>
            </div>

            {contextVisible && (
              <div className="context-output">{contextText}</div>
            )}
            {contextVisible && (
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-green" onClick={copiarContexto}>📋 COPIAR TODO — listo para pegar</button>
              </div>
            )}
          </div>
        </div>

        {/* ======= MI VM ======= */}
        <div className={S('mivm')}>
          <div className="section-title">MI VM PERSONAL</div>
          <div className="grid-2" style={{ marginBottom: '24px' }}>

            <div className="vm-card">
              <div className="vm-title">🖥️ CLOUD CLUSTERS</div>
              <div className="vm-sub">PC Virtual Windows — trabajo diario</div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">ESTADO</span>
                <span className="vm-spec-value" style={{ color: 'var(--accent)' }}>● ACTIVA</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">USO</span>
                <span className="vm-spec-value">Trabajo diario, coding, Claude</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">SO</span>
                <span className="vm-spec-value">Windows 11</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">ACCESO</span>
                <span className="vm-spec-value">RDP desde cualquier PC</span>
              </div>
              <div className="vm-acceso">
                <span>// Cómo conectarse:</span><br />
                1. Abre escritorio remoto (mstsc)<br />
                2. IP: <span>tu-ip-cloudclusters</span><br />
                3. Usuario: <span>Administrator</span><br />
                4. Contraseña: guardada en Drive
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://cloudclusters.io" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1 }}>🌐 Panel Cloud Clusters</a>
              </div>
            </div>

            <div className="vm-card" style={{ borderTopColor: 'var(--accent3)' }}>
              <div className="vm-title">🖥️ CLOUDING.IO</div>
              <div className="vm-sub">VPS España — proyectos y alumnos</div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">ESTADO</span>
                <span className="vm-spec-value" style={{ color: 'var(--accent3)' }}>● EN USO (WhatsApp agent)</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">USO</span>
                <span className="vm-spec-value">Proyectos en desarrollo</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">SO</span>
                <span className="vm-spec-value">Windows Server 2022</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">SALDO</span>
                <span className="vm-spec-value" style={{ color: 'var(--accent3)', fontFamily: 'var(--font-mono)' }}>
                  {vmBalance === null ? '€--.--' : vmBalance === 'error' ? '€--.--' : `€${vmBalance}`}
                </span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">COSTO</span>
                <span className="vm-spec-value">Por horas — apagar al no usar</span>
              </div>
              <div className="vm-acceso">
                <span>// API Clouding.io lista:</span><br />
                Crear VM: <span>POST /v1/servers</span><br />
                Apagar VM: <span>POST /v1/servers/{'{id}'}/poweroff</span><br />
                Borrar VM: <span>DELETE /v1/servers/{'{id}'}</span><br />
                Image ID Windows: <span>Lka79zd4JDnxyr85</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://panel.clouding.io" target="_blank" rel="noreferrer" className="btn btn-outline">🌐 Panel</a>
                <button className="btn btn-ghost" onClick={() => showModal('nuevaVM', '')}>➕ Nueva VM</button>
                {vmLoading ? (
                  <button className="btn btn-ghost" disabled>⏳ Procesando...</button>
                ) : vmStatus === 'archived' ? (
                  <button className="btn btn-green" onClick={desarchivar}>▶ Desarchivar VM</button>
                ) : vmStatus === 'active' ? (
                  <button className="btn btn-red" onClick={archivar}>⛔ Archivar VM</button>
                ) : vmStatus === null ? (
                  <button className="btn btn-ghost" disabled>⏳ Cargando...</button>
                ) : (
                  <button className="btn btn-ghost" disabled>⚠ Sin conexión</button>
                )}
              </div>
            </div>

            <div className="vm-card" style={{ borderTopColor: 'var(--accent4)' }}>
              <div className="vm-title">🖥️ DIGITALOCEAN</div>
              <div className="vm-sub">oc002sist-vm-01 — servidor proyectos</div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">ESTADO</span>
                <span className="vm-spec-value" style={{ color: doStatus === 'active' ? 'var(--accent)' : doStatus === 'off' ? 'var(--accent2)' : 'var(--text3)' }}>
                  {doStatus === 'active' ? '● ACTIVO' : doStatus === 'off' ? '● APAGADO' : '● —'}
                </span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">IP</span>
                <span className="vm-spec-value" style={{ fontFamily: 'var(--font-mono)' }}>{doIp || '—'}</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">PROVEEDOR</span>
                <span className="vm-spec-value">DigitalOcean</span>
              </div>
              <div className="vm-spec-row">
                <span className="vm-spec-label">COSTO</span>
                <span className="vm-spec-value">~$6/mes · apagar si no se usa</span>
              </div>
              <div className="vm-acceso">
                <span>// Droplet oc002sist-vm-01:</span><br />
                Encender: <span>power_on via API</span><br />
                Apagar: <span>power_off via API</span><br />
                Panel: <span>cloud.digitalocean.com</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://cloud.digitalocean.com" target="_blank" rel="noreferrer" className="btn btn-outline">🌐 Panel</a>
                {doLoading ? (
                  <button className="btn btn-ghost" disabled>⏳ Procesando...</button>
                ) : doStatus === 'active' ? (
                  <button className="btn btn-red" onClick={doTogglePower}>⛔ Apagar</button>
                ) : doStatus === 'off' ? (
                  <button className="btn btn-green" onClick={doTogglePower}>▶ Encender</button>
                ) : doStatus === null ? (
                  <button className="btn btn-ghost" disabled>⏳ Cargando...</button>
                ) : (
                  <button className="btn btn-ghost" disabled>⚠ Sin conexión</button>
                )}
              </div>
            </div>
          </div>

          <div className="section-title">GUÍA — CONFIGURAR ESTA APP EN TU VM</div>
          <div className="card">
            <div className="card-title">📋 PASOS PARA TRABAJAR DESDE EL DASHBOARD EN TU VM DE CLOUD CLUSTERS</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                {
                  n: '1', title: 'SUBIR A GITHUB',
                  body: <>Crear repo <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '2px', color: 'var(--accent)' }}>ai-command-center</code> en GitHub. Conectar a Vercel. URL quedará como <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '2px', color: 'var(--accent)' }}>ai-command-center.vercel.app</code></>
                },
                {
                  n: '2', title: 'ABRIR DESDE TU VM',
                  body: 'Dentro de Cloud Clusters, abrir Chrome y entrar a la URL de Vercel. Hacer bookmark en la barra. Desde ahí controlas todo.'
                },
                {
                  n: '3', title: 'PONER TUS API KEYS',
                  body: <>En la pestaña <strong>MIS IAs</strong>, clic en <strong>Editar Key</strong> de cada IA. Las keys se guardan en tu Google Drive en una carpeta privada llamada <code style={{ background: 'var(--bg3)', padding: '2px 6px', borderRadius: '2px', color: 'var(--accent)' }}>OC-001-MARCO/api-keys.json</code></>
                },
                {
                  n: '4', title: 'CONECTAR CLOUDING.IO',
                  body: <>Poner tu API key de Clouding.io en las variables de entorno de Vercel. Con eso los botones <strong>⛔ Apagar VM</strong> y <strong>➕ Nueva VM</strong> funcionan de verdad via API.</>
                },
                {
                  n: '5', title: 'MIGRAR A VM ESTABLE (cuando proyecto madure)',
                  body: (
                    <>
                      <div style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.6' }}>Opciones recomendadas por precio y estabilidad:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        {[
                          { name: 'HETZNER',      desc: '~€4/mes · Europeo · Muy estable',     note: '✓ Mejor precio',                  noteColor: 'var(--accent3)' },
                          { name: 'DIGITALOCEAN', desc: '~$6/mes · Muy confiable · API fácil',  note: '✓ Más conocido',                  noteColor: 'var(--accent3)' },
                          { name: 'CLOUDING.IO',  desc: '€10/mes aprox · España · Ya lo usas', note: '→ Opción si no quieres cambiar',   noteColor: 'var(--text2)' },
                        ].map(opt => (
                          <div key={opt.name} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '3px', padding: '12px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--accent4)', marginBottom: '4px' }}>{opt.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{opt.desc}</div>
                            <div style={{ fontSize: '12px', color: opt.noteColor, marginTop: '4px' }}>{opt.note}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                },
              ].map((step, i, arr) => (
                <div key={step.n} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-disp)', fontSize: '36px', color: 'var(--accent)', minWidth: '48px', lineHeight: 1 }}>{step.n}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{step.title}</div>
                    <div style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.6' }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* /main */}

      {/* MODAL */}
      <div
        className={`modal-overlay${modal.open ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal() }}
      >
        <div className="modal">
          <div className="modal-title">{getModalTitle()}</div>
          <div><ModalBody /></div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-green" onClick={closeModal}>Confirmar</button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.message}</div>
    </>
  )
}
