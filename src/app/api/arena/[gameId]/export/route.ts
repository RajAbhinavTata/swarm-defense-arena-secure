import { NextResponse } from 'next/server';
import {
  exportSessionCsv,
  exportSessionJson,
  exportSessionShareGptJsonl,
} from '@/lib/simulation/exporters';
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
    const gameId = assertGameId(rawGameId);
    const session = await getSession(gameId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  if (format === 'csv') {
    return new NextResponse(exportSessionCsv(session), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="arena-session-${gameId}.csv"`,
      },
    });
  }

  if (format === 'sharegpt') {
    return new NextResponse(exportSessionShareGptJsonl(session), {
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'content-disposition': `attachment; filename="arena-session-${gameId}.jsonl"`,
      },
    });
  }

    return new NextResponse(exportSessionJson(session), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="arena-session-${gameId}.json"`,
      },
    });
  } catch (error) {
    const status = error instanceof AccessError || error instanceof ValidationError ? error.status : 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
