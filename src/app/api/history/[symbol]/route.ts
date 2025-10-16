import { NextResponse } from 'next/server'

const FINNHUB_BASE = 'https://finnhub.io/api/v1/stock/candle'

function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export async function GET(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
  }

  // parse optional query params (from, to) in unix seconds
  const url = new URL(req.url)
  const fromParam = url.searchParams.get('from')
  const toParam = url.searchParams.get('to')

  const to = toParam ? new Date(Number(toParam) * 1000) : new Date()
  const from = fromParam
    ? new Date(Number(fromParam) * 1000)
    : (() => {
        const d = new Date()
        d.setMonth(d.getMonth() - 6)
        return d
      })()

  const apiKey = process.env.FINNHUB_API_KEY

  // Try upstream Finnhub if API key present; fallback to mock on any failure
  if (apiKey) {
    try {
      const fhUrl = `${FINNHUB_BASE}?symbol=${encodeURIComponent(
        symbol.toUpperCase()
      )}&resolution=D&from=${toUnix(from)}&to=${toUnix(to)}&token=${apiKey}`

      const res = await fetch(fhUrl, { next: { revalidate: 60 } })
      if (!res.ok) {
        // non-2xx from Finnhub -> fallback to mock
        console.warn('Finnhub history fetch failed:', res.status, await res.text())
      } else {
        const json = await res.json()
        // Finnhub returns { s: 'ok'|'no_data'|'error', t:[], c:[], o:[], h:[], l:[], v:[] }
        if (json && json.s === 'ok' && Array.isArray(json.t) && Array.isArray(json.c)) {
          const t: number[] = json.t
          const c: number[] = json.c || []
          const o: number[] = json.o || []
          const h: number[] = json.h || []
          const l: number[] = json.l || []
          const v: number[] = json.v || []

          const len = t.length
          const out: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = []
          for (let i = 0; i < len; i++) {
            const dt = new Date(t[i] * 1000)
            out.push({
              date: dt.toISOString().split('T')[0],
              open: Number.isFinite(o[i]) ? Number(o[i]) : Number(c[i] ?? 0),
              high: Number.isFinite(h[i]) ? Number(h[i]) : Number(c[i] ?? 0),
              low: Number.isFinite(l[i]) ? Number(l[i]) : Number(c[i] ?? 0),
              close: Number.isFinite(c[i]) ? Number(c[i]) : 0,
              volume: Number.isFinite(v[i]) ? Number(v[i]) : 0
            })
          }

          return NextResponse.json({ data: out, isMock: false, source: 'finnhub' })
        } else {
          console.warn('Finnhub returned no data for', symbol, json && json.s)
        }
      }
    } catch (err) {
      console.warn('Error fetching Finnhub history for', symbol, err)
      // fall through to mock below
    }
  } else {
    console.warn('FINNHUB_API_KEY not set; returning mock history for', symbol)
  }

  // Fallback: generate mock history
  return NextResponse.json({ data: generateMockHistory(from, to), isMock: true, source: 'mock' })
}

function generateMockHistory(from: Date, to: Date) {
  const fromTs = Math.floor(from.getTime() / 1000)
  const toTs = Math.floor(to.getTime() / 1000)
  const days = Math.max(2, Math.floor((toTs - fromTs) / (24 * 60 * 60)))
  const out: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = []
  let price = 100 + Math.random() * 200
  for (let i = 0; i < days; i++) {
    price = price * (0.99 + Math.random() * 0.02)
    const open = price * (0.99 + Math.random() * 0.02)
    const close = price * (0.99 + Math.random() * 0.02)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (0.99 - Math.random() * 0.01)
    const volume = Math.floor(100000 + Math.random() * 900000)
    const d = new Date(fromTs * 1000 + i * 24 * 60 * 60 * 1000)
    out.push({ date: d.toISOString().split('T')[0], open, high, low, close, volume })
  }
  return out
}


