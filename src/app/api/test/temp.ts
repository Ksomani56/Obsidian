import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY
  console.log('Checking for API key...')
  
  return NextResponse.json({
    status: apiKey ? 'success' : 'error',
    message: apiKey ? 'API key is present' : 'API key not found',
    key_length: apiKey?.length || 0,
    env_vars: Object.keys(process.env)
  })
}
