function getToken(alumno) {
  const id = alumno.toLowerCase()
  if (id === 'oc001') return process.env.DIGITALOCEAN_TOKEN_OC001
  if (id === 'oc002') return process.env.DIGITALOCEAN_TOKEN
  return null
}

export async function GET(request, { params }) {
  const { alumno } = await params
  const token = getToken(alumno)

  if (!token) {
    return Response.json({ error: 'Token no configurado para este alumno' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.digitalocean.com/v2/droplets', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return Response.json({ error: errData.message || 'Error de DigitalOcean' }, { status: res.status })
    }

    const data = await res.json()
    const droplet = data.droplets?.[0]

    if (!droplet) {
      return Response.json({ status: 'unknown', ip: null, dropletId: null })
    }

    return Response.json({
      status:    droplet.status,
      ip:        droplet.networks?.v4?.find(n => n.type === 'public')?.ip_address || null,
      dropletId: droplet.id,
      name:      droplet.name,
    })
  } catch {
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
