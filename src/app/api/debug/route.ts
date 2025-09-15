import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  return NextResponse.json({
    api_key_present: !!apiKey,
    api_key_length: apiKey?.length,
    env_vars: Object.keys(process.env).filter(key => key.includes('FINNHUB')),
    timestamp: new Date().toISOString()
  });
}
