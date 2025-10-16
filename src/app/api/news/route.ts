import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols') || ''
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)))
    const apiKey = process.env.MARKETAUX_API_KEY

    const envLoaded = Boolean(apiKey)
    if (apiKey) {
      const nocache = searchParams.get('nocache') === '1'
      const qs = new URLSearchParams({
        symbols,
        limit: String(limit),
        api_token: apiKey,
        language: 'en'
      })
      if (nocache) qs.set('_ts', String(Date.now()))
      const url = `https://api.marketaux.com/v1/news/all?${qs.toString()}`

      const fetchOptions: RequestInit & { next?: any } = nocache
        ? { cache: 'no-store', headers: { Accept: 'application/json' } }
        : { next: { revalidate: 900 }, headers: { Accept: 'application/json' } }

      const res = await fetch(url, fetchOptions)
      if (res.ok) {
        const payload = await res.json()
        const articles = Array.isArray(payload?.data) ? payload.data : []
        const mapped = articles.map((a: any) => ({
          title: a.title,
          description: a.description,
          url: a.url,
          published_at: a.published_at
        }))
        return NextResponse.json({ success: true, data: mapped, count: mapped.length })
      }
      // Fallthrough to mock on non-OK, but include upstream status for debugging
      return NextResponse.json({ success: true, data: [], count: 0, mock: true, envLoaded, upstreamStatus: res.status, upstreamStatusText: res.statusText })
    }

    // Mock fallback (fixed)
    const now = Date.now()
    const mock = [
      { title: 'Market snapshot', description: 'Equities mixed as investors digest data.', url: 'https://example.com/1', published_at: new Date(now - 2*3600*1000).toISOString() },
      { title: 'Tech leads gains', description: 'Mega-cap tech pushes indices higher.', url: 'https://example.com/2', published_at: new Date(now - 5*3600*1000).toISOString() }
    ]
    return NextResponse.json({ success: true, data: mock, count: mock.length, mock: true, envLoaded })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json({ success: true, data: [], count: 0, mock: true, error: 'fetch_failed' })
  }
}
