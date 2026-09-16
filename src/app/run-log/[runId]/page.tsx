import { ReplayClient } from './replay-client';

interface Params {
  params: Promise<{ runId: string }>;
}

export default async function ReplayPage({ params }: Params) {
  const { runId } = await params;
  return <ReplayClient gameId={runId} />;
}
