export async function GET() {
  try {
    const token = process.env.DIGITALOCEAN_TOKEN

    if (!token) {
      return Response.json({ error: 'DIGITALOCEAN_TOKEN no configurada' }, { status: 500 })
    }

    const res = await fetch('https://api.digitalocean.com/v2/droplets', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    const droplets = (data.droplets || []).map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      ip: d.networks?.v4?.[0]?.ip_address || null,
      memory: d.memory,
      vcpus: d.vcpus,
    }))

    return Response.json({ droplets })
  } catch {
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
