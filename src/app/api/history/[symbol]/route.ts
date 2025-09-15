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
    return NextResponse.json({ error: 'Missing FINNHUB_API_KEY' }, { status: 500 })
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
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status })
    }
    const data = await res.json()

    // Finnhub returns s: 'ok' / 'no_data'
    if (!data || data.s !== 'ok' || !Array.isArray(data.t)) {
      return NextResponse.json({ data: [] })
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
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}


