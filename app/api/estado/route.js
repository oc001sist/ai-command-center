import { NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com/repos/oc001sist/ai-command-center/contents/ESTADO.md'

function parseActividad(markdown) {
  const section = markdown.match(/## Actividad reciente\n([\s\S]*?)(?=\n## |$)/)
  if (!section) return []
  return section[1]
    .split('\n')
    .filter(line => line.startsWith('- '))
    .map(line => {
      const text = line.slice(2).trim()
      const colonIdx = text.indexOf(': ')
      if (colonIdx === -1) return { time: '', text }
      return { time: text.slice(0, colonIdx), text: text.slice(colonIdx + 2) }
    })
}

function parseVMs(markdown) {
  const section = markdown.match(/## VMs Clouding\.io\n([\s\S]*?)(?=\n## |$)/)
  if (!section) return []
  const rows = section[1]
    .split('\n')
    .filter(line => line.startsWith('|') && !line.includes('---'))
  // skip header row
  return rows.slice(1).map(row => {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean)
    return { id: cols[0], alumno: cols[1], credit: cols[2], estado: cols[3] }
  })
}

export async function GET() {
  try {
    const headers = { 'Accept': 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const res = await fetch(GITHUB_API, { headers, next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)

    const json = await res.json()
    const markdown = Buffer.from(json.content, 'base64').toString('utf-8')

    return NextResponse.json({
      actividad: parseActividad(markdown),
      vms: parseVMs(markdown),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
