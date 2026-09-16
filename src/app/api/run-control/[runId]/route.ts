import { NextResponse } from 'next/server';
import { getSession } from '@/lib/run-engine/store';
import { assertApiAccess, AccessError } from '@/lib/run-engine/request-security';
import { assertGameId, ValidationError } from '@/lib/run-engine/validation';

interface Params {
  params: Promise<{ runId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    assertApiAccess(request);
    const { runId } = await params;
    const session = await getSession(assertGameId(runId));

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    return NextResponse.json({ session }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof AccessError || error instanceof ValidationError ? error.status : 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
