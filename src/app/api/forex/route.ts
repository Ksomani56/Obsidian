import { NextResponse } from 'next/server'

interface ForexResponse {
  quote: {
    INR: number
  }
}

export async function GET() {
  // Free-tier mode: always return mock FX; do not call upstream
  return NextResponse.json({ quote: { INR: 83 }, mock: true })
}
