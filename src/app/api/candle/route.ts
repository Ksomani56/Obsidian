import { NextResponse } from 'next/server'

interface CandleResponse {
  t: number[]  // Timestamps
  c: number[]  // Close prices
  o: number[]  // Open prices
  h: number[]  // High prices
  l: number[]  // Low prices
  v: number[]  // Volumes
  s: string    // Status
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!symbol || !from || !to) {
    return NextResponse.json(
      { error: 'Symbol, from, and to parameters are required' },
      { status: 400 }
    )
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('Finnhub API key not found, using mock data')
    return NextResponse.json({ ...generateMockCandles(Number(from), Number(to), symbol), mock: true })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`)
    }

    const data: CandleResponse = await response.json()
    if (data.s !== 'ok') {
      throw new Error('No data available')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching candles:', error)
    // Fallback to mock data
    return NextResponse.json({ ...generateMockCandles(Number(from), Number(to), symbol), mock: true })
  }
}

function generateMockCandles(from: number, to: number, symbol?: string | null) {
  const days = Math.floor((to - from) / (24 * 60 * 60))
  // Deterministic seed per symbol and day
  const seedStr = `${symbol || 'MOCK'}-${new Date(from * 1000).toISOString().slice(0,10)}`
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 10000) / 10000 }
  const basePrice = 100 + rnd() * 200
  
  const t: number[] = []
  const c: number[] = []
  const o: number[] = []
  const h: number[] = []
  const l: number[] = []
  const v: number[] = []

  for (let i = 0; i < days; i++) {
    const timestamp = from + i * 24 * 60 * 60
    const openPrice = basePrice * (0.8 + rnd() * 0.4)
    const closePrice = openPrice * (0.9 + rnd() * 0.2)
    const highPrice = Math.max(openPrice, closePrice) * (1 + rnd() * 0.1)
    const lowPrice = Math.min(openPrice, closePrice) * (0.9 + rnd() * 0.1)
    const volume = Math.floor(100000 + rnd() * 900000)

    t.push(timestamp)
    o.push(openPrice)
    c.push(closePrice)
    h.push(highPrice)
    l.push(lowPrice)
    v.push(volume)
  }

  return {
    t,
    c,
    o,
    h,
    l,
    v,
    s: 'ok'
  }
}
