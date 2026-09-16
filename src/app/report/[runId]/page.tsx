import { FinisherClient } from './finisher-client';

interface Params {
  params: Promise<{ runId: string }>;
}

export default async function FinisherPage({ params }: Params) {
  const { runId } = await params;
  return <FinisherClient gameId={runId} />;
}
