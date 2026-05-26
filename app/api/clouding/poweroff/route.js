export async function POST(request) {
  try {
    const { serverId } = await request.json()

    if (!serverId) {
      return Response.json({ error: 'serverId requerido' }, { status: 400 })
    }

    const apiKey    = process.env.CLOUDING_API_KEY
    const apiSecret = process.env.CLOUDING_API_SECRET

    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'API keys de Clouding.io no configuradas en variables de entorno' }, { status: 500 })
    }

    // Clouding.io usa HTTP Basic Auth: API Key como usuario, API Secret como contraseña
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

    const res = await fetch(`https://api.clouding.io/v1/servers/${serverId}/poweroff`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
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
