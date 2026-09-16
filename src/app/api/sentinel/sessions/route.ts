import { NextResponse } from 'next/server';
import { listSessions } from '@/lib/sentinel/store';
import { assertApiAccess, AccessError } from '@/lib/sentinel/request-security';

export async function GET(request: Request) {
  try {
    assertApiAccess(request);
    const sessions = await listSessions();
    return NextResponse.json({ sessions }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: error instanceof AccessError ? error.status : 500 });
  }
}
