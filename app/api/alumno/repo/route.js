export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const repo   = searchParams.get('repo') || process.env.ALUMNO_REPO
    const alumno = searchParams.get('alumno') || 'oc001'
    const token  = alumno === 'oc002'
      ? process.env.GITHUB_TOKEN_OC002
      : process.env.GITHUB_TOKEN

    if (!repo || repo === '-') {
      return Response.json({ error: 'Repo no disponible' }, { status: 404 })
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
