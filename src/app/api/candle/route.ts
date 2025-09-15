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
    return NextResponse.json(generateMockCandles(Number(from), Number(to)))
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
    return NextResponse.json(generateMockCandles(Number(from), Number(to)))
  }
}

function generateMockCandles(from: number, to: number) {
  const days = Math.floor((to - from) / (24 * 60 * 60))
  const basePrice = 100 + Math.random() * 200
  
  const t: number[] = []
  const c: number[] = []
  const o: number[] = []
  const h: number[] = []
  const l: number[] = []
  const v: number[] = []

  for (let i = 0; i < days; i++) {
    const timestamp = from + i * 24 * 60 * 60
    const openPrice = basePrice * (0.8 + Math.random() * 0.4)
    const closePrice = openPrice * (0.9 + Math.random() * 0.2)
    const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.1)
    const lowPrice = Math.min(openPrice, closePrice) * (0.9 + Math.random() * 0.1)
    const volume = Math.floor(100000 + Math.random() * 900000)

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
