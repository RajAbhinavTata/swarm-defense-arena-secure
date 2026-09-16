import { NextResponse } from 'next/server';
import {
  exportSessionsCsv,
  exportSessionsJson,
  exportSessionsShareGptJsonl,
} from '@/lib/simulation/exporters';
import { listSessions } from '@/lib/simulation/store';
import { assertApiAccess, AccessError } from '@/lib/simulation/request-security';

export async function GET(request: Request) {
  try {
    assertApiAccess(request);
    const sessions = await listSessions();
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  if (format === 'csv') {
    return new NextResponse(exportSessionsCsv(sessions), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="arena-dataset.csv"',
      },
    });
  }

  if (format === 'sharegpt') {
    return new NextResponse(exportSessionsShareGptJsonl(sessions), {
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'content-disposition': 'attachment; filename="arena-dataset.jsonl"',
      },
    });
  }

    return new NextResponse(exportSessionsJson(sessions), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="arena-dataset.json"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: error instanceof AccessError ? error.status : 500 });
  }
}
