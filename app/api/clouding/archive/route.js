export async function POST() {
  try {
    const apiKey   = process.env.CLOUDING_API_KEY
    const serverId = process.env.CLOUDING_SERVER_ID

    if (!apiKey) {
      return Response.json({ error: 'CLOUDING_API_KEY no configurada en variables de entorno' }, { status: 500 })
    }
    if (!serverId) {
      return Response.json({ error: 'CLOUDING_SERVER_ID no configurada en variables de entorno' }, { status: 500 })
    }

    const res = await fetch(`https://api.clouding.io/v1/servers/${serverId}/archive`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
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

    const data = await res.json()
    return Response.json({ ok: true, data })
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
