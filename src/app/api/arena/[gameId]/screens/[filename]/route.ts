import { NextResponse } from 'next/server';
import { assertApiAccess, AccessError } from '@/lib/simulation/request-security';
import { getScreenshot } from '@/lib/simulation/store';
import { assertGameId, assertScreenshotFilename, ValidationError } from '@/lib/simulation/validation';

interface Params { params: Promise<{ gameId: string; filename: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    assertApiAccess(request);
    const raw = await params;
    const image = await getScreenshot(assertGameId(raw.gameId), assertScreenshotFilename(raw.filename));
    if (!image) return NextResponse.json({ error: 'Screenshot not found.' }, { status: 404 });
    return new NextResponse(new Uint8Array(image), {
      headers: {
        'content-type': 'image/png',
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    const status = error instanceof AccessError || error instanceof ValidationError ? error.status : 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
