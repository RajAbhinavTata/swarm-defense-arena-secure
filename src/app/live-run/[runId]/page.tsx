import { ArenaClient } from './arena-client';

interface Params {
  params: Promise<{ runId: string }>;
}

export default async function ArenaPage({ params }: Params) {
  const { runId } = await params;
  return <ArenaClient gameId={runId} />;
}
