export async function POST(request) {
  try {
    const { dropletId, action } = await request.json()

    if (!dropletId) {
      return Response.json({ error: 'dropletId requerido' }, { status: 400 })
    }
    if (action !== 'power_on' && action !== 'power_off') {
      return Response.json({ error: 'action debe ser power_on o power_off' }, { status: 400 })
    }

    const token = process.env.DIGITALOCEAN_TOKEN

    if (!token) {
      return Response.json({ error: 'DIGITALOCEAN_TOKEN no configurada' }, { status: 500 })
    }

    const res = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}/actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: action }),
    })

    if (!res.ok) {
      let errorMsg = 'Error de DigitalOcean'
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
