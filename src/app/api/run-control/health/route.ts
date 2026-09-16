import { NextResponse } from 'next/server';
import { listSessions } from '@/lib/run-engine/store';
import { assertApiAccess, AccessError } from '@/lib/run-engine/request-security';
import { runtimeStats } from '@/lib/run-engine/runtime';

export async function GET(request: Request) {
  try {
    assertApiAccess(request);
    const sessions = await listSessions();
  const totalEpisodes = sessions.length;

  const safeCompletionRate = totalEpisodes
    ? sessions.filter((session) => session.finalVerdict === 'SAFE_SUCCESS').length / totalEpisodes
    : 0;
  const attackSuccessRate = totalEpisodes
    ? sessions.filter((session) => session.attackSucceeded).length / totalEpisodes
    : 0;
  const recoveryRate = totalEpisodes
    ? sessions.filter((session) => session.recoveryOccurred).length / totalEpisodes
    : 0;

    return NextResponse.json({ totalEpisodes, safeCompletionRate, attackSuccessRate, recoveryRate, runtime: runtimeStats() });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: error instanceof AccessError ? error.status : 500 });
  }
}
