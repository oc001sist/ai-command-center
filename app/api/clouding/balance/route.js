export async function GET() {
  try {
    const apiKey = process.env.CLOUDING_API_KEY

    if (!apiKey) {
      return Response.json({ error: 'CLOUDING_API_KEY no configurada en variables de entorno' }, { status: 500 })
    }

    const res = await fetch('https://api.clouding.io/v1/account', {
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

    const data = await res.json()

    const raw = data.balance ?? data.credit ?? data.amount ?? null
    const balance = raw !== null ? parseFloat(raw).toFixed(2) : null

    return Response.json({
      balance,
      currency: data.currency || 'EUR',
    })
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
