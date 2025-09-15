import { NextResponse } from 'next/server'

interface QuoteResponse {
  c: number  // Current price
  h: number  // High price of the day
  l: number  // Low price of the day
  o: number  // Open price of the day
  pc: number // Previous close price
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('Finnhub API key not found, using mock data')
    // Return mock data
    return NextResponse.json({
      c: 100 + Math.random() * 200,
      h: 150 + Math.random() * 200,
      l: 50 + Math.random() * 200,
      o: 100 + Math.random() * 200,
      pc: 100 + Math.random() * 200,
    })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`)
    }

    const data: QuoteResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching quote:', error)
    // Fallback to mock data
    return NextResponse.json({
      c: 100 + Math.random() * 200,
      h: 150 + Math.random() * 200,
      l: 50 + Math.random() * 200,
      o: 100 + Math.random() * 200,
      pc: 100 + Math.random() * 200,
    })
  }
}
