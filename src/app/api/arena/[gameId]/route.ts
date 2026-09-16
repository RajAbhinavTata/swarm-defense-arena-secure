import { NextResponse } from 'next/server';
import { getSession } from '@/lib/simulation/store';
import { assertApiAccess, AccessError } from '@/lib/simulation/request-security';
import { assertGameId, ValidationError } from '@/lib/simulation/validation';

interface Params {
  params: Promise<{ gameId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    assertApiAccess(request);
    const { gameId: rawGameId } = await params;
    const session = await getSession(assertGameId(rawGameId));

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    return NextResponse.json({ session }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof AccessError || error instanceof ValidationError ? error.status : 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
