import { NextResponse } from 'next/server'

interface ForexResponse {
  quote: {
    INR: number
  }
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('Finnhub API key not found, using default INR rate')
    return NextResponse.json({ quote: { INR: 83 } })
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/forex/rates?base=USD&token=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour since forex rates don't change as frequently
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.statusText}`)
    }

    const data: ForexResponse = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching forex rates:', error)
    // Fallback to default rate
    return NextResponse.json({ quote: { INR: 83 } })
  }
}
