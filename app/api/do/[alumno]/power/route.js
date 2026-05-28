function getToken(alumno) {
  const id = alumno.toLowerCase()
  if (id === 'oc001') return process.env.DIGITALOCEAN_TOKEN_OC001
  if (id === 'oc002') return process.env.DIGITALOCEAN_TOKEN
  return null
}

export async function POST(request, { params }) {
  const { alumno } = await params
  const token = getToken(alumno)

  if (!token) {
    return Response.json({ error: 'Token no configurado para este alumno' }, { status: 500 })
  }

  try {
    const { dropletId, action } = await request.json()

    if (!dropletId) {
      return Response.json({ error: 'dropletId requerido' }, { status: 400 })
    }
    if (action !== 'power_on' && action !== 'power_off') {
      return Response.json({ error: 'action debe ser power_on o power_off' }, { status: 400 })
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
      const errData = await res.json().catch(() => ({}))
      return Response.json({ error: errData.message || 'Error de DigitalOcean' }, { status: res.status })
    }

    const data = await res.json()
    return Response.json({ ok: true, data })
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
