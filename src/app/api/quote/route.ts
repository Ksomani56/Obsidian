import { NextResponse } from 'next/server'

interface QuoteResponse {
  c: number  // Current price
  h: number  // High price of the day
  l: number  // Low price of the day
  o: number  // Open price of the day
  pc: number // Previous close price
  d?: number // Change
  dp?: number // Change percent
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawSymbol = searchParams.get('symbol')

  if (!rawSymbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 })
  }

  // Normalize symbols for Finnhub
  // Support inputs like INFY.NS -> NSE:INFY, RELIANCE.BO -> BSE:RELIANCE
  const normalizeSymbol = (s: string): string => {
    const sym = s.trim()
    if (sym.startsWith('^')) return sym // indices
    if (/\.NS$/i.test(sym)) return `NSE:${sym.replace(/\.NS$/i, '')}`
    if (/\.BO$/i.test(sym)) return `BSE:${sym.replace(/\.BO$/i, '')}`
    if (/^[A-Z]{1,10}$/i.test(sym)) return sym.toUpperCase() // plain US tickers
    return sym // pass through others (e.g., already NSE:INFY)
  }

  const symbol = normalizeSymbol(rawSymbol)

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('Finnhub API key not found, using mock data')
    // Deterministic mock data based on symbol and date
    const seedStr = `${symbol}-${new Date().toISOString().slice(0,10)}`
    let seed = 0
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
    const rnd = () => {
      // xorshift32
      seed ^= seed << 13
      seed ^= seed >>> 17
      seed ^= seed << 5
      return ((seed >>> 0) % 10000) / 10000
    }
    const pc = 100 + rnd() * 200
    const c = pc + (rnd() - 0.5) * 5
    const d = c - pc
    const dp = pc ? (d / pc) * 100 : 0
    return NextResponse.json({
      c,
      h: Math.max(c, pc) + rnd() * 5,
      l: Math.min(c, pc) - rnd() * 5,
      o: pc + (rnd() - 0.5) * 2,
      pc,
      d,
      dp,
      mock: true,
    })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`)
    }

    const data: QuoteResponse = await response.json()
    if (data && typeof data.c === 'number' && data.c > 0) {
      return NextResponse.json(data)
    }
    // Finnhub can return zeros when unavailable. For indices or exchange-prefixed symbols,
    // return a lightweight mock to avoid breaking UX (e.g., market widget).
    if (symbol.startsWith('^') || symbol.includes(':')) {
      const seedStr = `${symbol}-${new Date().toISOString().slice(0,10)}`
      let seed = 0
      for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
      const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 10000) / 10000 }
      const pc = 100 + rnd() * 200
      const c = pc + (rnd() - 0.5) * 5
      const d = c - pc
      const dp = pc ? (d / pc) * 100 : 0
      return NextResponse.json({ c, h: Math.max(c, pc) + rnd() * 5, l: Math.min(c, pc) - rnd() * 5, o: pc, pc, d, dp, mock: true })
    }
    return NextResponse.json({ error: 'Data unavailable' }, { status: 503 })
  } catch (error) {
    console.error('Error fetching quote:', error)
    // For indices or exchange-prefixed symbols, provide mock data on failure
    if (rawSymbol && (rawSymbol.startsWith('^') || rawSymbol.includes(':') || /\.(NS|BO)$/i.test(rawSymbol))) {
      const pc = 100 + Math.random() * 200
      const c = pc + (Math.random() - 0.5) * 5
      const d = c - pc
      const dp = pc ? (d / pc) * 100 : 0
      return NextResponse.json({ c, h: Math.max(c, pc) + Math.random() * 5, l: Math.min(c, pc) - Math.random() * 5, o: pc, pc, d, dp, mock: true })
    }
    return NextResponse.json({ error: 'Data unavailable' }, { status: 503 })
  }
}
