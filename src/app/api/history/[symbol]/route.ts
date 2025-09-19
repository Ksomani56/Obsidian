import { NextResponse } from 'next/server'

const FINNHUB_BASE = 'https://finnhub.io/api/v1/stock/candle'

function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing FINNHUB_API_KEY', data: [], isMock: true })
  }

  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 6)

  const url = `${FINNHUB_BASE}?symbol=${encodeURIComponent(
    symbol.toUpperCase()
  )}&resolution=D&from=${toUnix(from)}&to=${toUnix(to)}&token=${apiKey}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('History upstream error:', res.status, res.statusText, text)
      return NextResponse.json({
        error: 'Upstream error',
        status: res.status,
        statusText: res.statusText,
        data: [],
        isMock: true,
        mock: generateMockHistory(from, to)
      })
    }
    const data = await res.json()

    // Finnhub returns s: 'ok' / 'no_data'
    if (!data || data.s !== 'ok' || !Array.isArray(data.t)) {
      console.warn('History returned no_data; falling back to mock for', symbol)
      return NextResponse.json({ data: generateMockHistory(from, to), isMock: true })
    }

    const out = (data.t as number[]).map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: data.o?.[i] ?? null,
      high: data.h?.[i] ?? null,
      low: data.l?.[i] ?? null,
      close: data.c?.[i] ?? null,
      volume: data.v?.[i] ?? null,
    }))

    return NextResponse.json({ data: out })
  } catch (err) {
    console.error('History fetch failed:', err)
    return NextResponse.json({ data: generateMockHistory(from, to), isMock: true })
  }
}


function generateMockHistory(from: Date, to: Date) {
  const fromUnix = Math.floor(from.getTime() / 1000)
  const toUnix = Math.floor(to.getTime() / 1000)
  const days = Math.max(2, Math.floor((toUnix - fromUnix) / (24 * 60 * 60)))
  const out: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = []
  let price = 100 + Math.random() * 200
  for (let i = 0; i < days; i++) {
    price = price * (0.99 + Math.random() * 0.02)
    const open = price * (0.99 + Math.random() * 0.02)
    const close = price * (0.99 + Math.random() * 0.02)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (0.99 - Math.random() * 0.01)
    const volume = Math.floor(100000 + Math.random() * 900000)
    const d = new Date(fromUnix * 1000 + i * 24 * 60 * 60 * 1000)
    out.push({ date: d.toISOString().split('T')[0], open, high, low, close, volume })
  }
  return out
}


