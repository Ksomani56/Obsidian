import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY

  try {
    // Test the API key with a simple AAPL quote request
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`,
      { next: { revalidate: 0 } } // Don't cache this test request
    )

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json({
      status: 'success',
      message: 'API key is working',
      sample_data: data
    })
  } catch (error) {
    console.error('API test failed:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      api_key_present: !!apiKey,
      api_key_length: apiKey?.length
    }, { status: 500 })
  }
}
