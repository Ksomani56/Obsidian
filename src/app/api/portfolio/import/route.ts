import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return NextResponse.json({ ok: true, received: Array.isArray(body) ? body.length : 0 });
}


