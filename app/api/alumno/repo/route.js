export async function GET() {
  try {
    const repo  = process.env.ALUMNO_REPO
    const token = process.env.GITHUB_TOKEN

    if (!repo) {
      return Response.json({ error: 'ALUMNO_REPO no configurada' }, { status: 500 })
    }

    const headers = { 'Accept': 'application/vnd.github+json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
      headers,
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return Response.json({ error: `GitHub API ${res.status}` }, { status: res.status })
    }

    const commits = await res.json()
    const commit  = commits[0]
    if (!commit) return Response.json({ error: 'Sin commits' }, { status: 404 })

    return Response.json({
      sha:     commit.sha.slice(0, 7),
      message: commit.commit.message.split('\n')[0],
      author:  commit.commit.author.name,
      date:    commit.commit.author.date,
      url:     commit.html_url,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
