export async function GET() {
  try {
    const apiKey   = process.env.CLOUDING_API_KEY
    const serverId = process.env.CLOUDING_SERVER_ID

    if (!apiKey) {
      return Response.json({ error: 'CLOUDING_API_KEY no configurada' }, { status: 500 })
    }
    if (!serverId) {
      return Response.json({ error: 'CLOUDING_SERVER_ID no configurada' }, { status: 500 })
    }

    const res = await fetch(`https://api.clouding.io/v1/servers/${serverId}`, {
      headers: {
        'X-API-KEY': apiKey,
      },
    })

    if (!res.ok) {
      let errorMsg = 'Error de Clouding.io'
      try {
        const errData = await res.json()
        errorMsg = errData.message || errorMsg
      } catch {}
      return Response.json({ error: errorMsg }, { status: res.status })
    }

    const server = await res.json()

    const rawStatus = (server.status || '').toLowerCase()
    let status = 'unknown'
    if (rawStatus === 'active') status = 'active'
    else if (rawStatus === 'archived') status = 'archived'

    return Response.json({
      status,
      name: server.name || null,
      ip:   server.ipAddress || server.ip || null,
    })
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
