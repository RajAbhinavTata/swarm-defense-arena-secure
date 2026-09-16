import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import { assertApiAccess, assertSameOrigin, assertStartRateLimit, AccessError } from '@/lib/run-engine/request-security';
import { enqueueRun } from '@/lib/run-engine/runtime';
import { runSimulation } from '@/lib/run-engine/runner';
import { DIFFICULTY_STEP_LIMIT, getScenario, getTaskForDifficulty } from '@/lib/run-engine/scenarios';
import { saveSession } from '@/lib/run-engine/store';
import type { ArenaSession, StartSimulationRequest } from '@/lib/run-engine/types';
import { validateTargetUrl, UnsafeTargetError } from '@/lib/run-engine/target-security';
import { parseStartRequest, ValidationError } from '@/lib/run-engine/validation';

export async function POST(request: Request) {
  try {
    assertApiAccess(request);
    assertSameOrigin(request);
    assertStartRateLimit(request);
    const body = parseStartRequest(await request.json()) as StartSimulationRequest;
    const scenarioId = 'live-web';
    const difficulty = body.difficulty ?? 'easy';
    const taskAgentType = body.taskAgentType ?? 'llm-policy';
    const redTeamType = body.redTeamType ?? 'llm-red-team';

    const scenario = getScenario(scenarioId);
    if (!body.targetUrl) {
      return NextResponse.json(
        { ok: false, error: 'A valid http(s) targetUrl is required for Live Web mode.' },
        { status: 400 },
      );
    }
    const requestHostname = new URL(request.url).hostname;
    const allowLoopback = ['localhost', '127.0.0.1', '::1'].includes(requestHostname);
    const targetUrl = (await validateTargetUrl(body.targetUrl, { allowLoopback })).toString();

    const task =
      (body.customTask?.trim() && body.customTask.trim().length > 0)
        ? body.customTask.trim()
        : getTaskForDifficulty(scenarioId, difficulty);
    const gameId = nanoid(12);
    const startedAt = new Date().toISOString();

    const session: ArenaSession = {
      gameId,
      scenarioId,
      scenarioLabel: scenario.label,
      scenarioPath: targetUrl ?? scenario.path,
      targetUrl: targetUrl ?? undefined,
      difficulty,
      startedAt,
      taskAgentType,
      redTeamType,
      winner: 'Draw',
      finalVerdict: 'UNSAFE_FAILURE',
      taskCompleted: false,
      attackSucceeded: false,
      recoveryOccurred: false,
      safetyScore: 0,
      promptHealth: 100,
      promptHealthHistory: [
        {
          stepNumber: 0,
          health: 100,
          delta: 0,
          cause: 'session_start',
          timestamp: startedAt,
        },
      ],
      failureLabels: [],
      task,
      currentTaskAgentStatus: 'queued',
      currentRedTeamStatus: 'queued',
      currentStep: 0,
      totalStepsPlanned: DIFFICULTY_STEP_LIMIT[difficulty],
      taskAgentSteps: [],
      redTeamActions: [],
      eventsLog: [],
    };

    await saveSession(session);

    const origin = new URL(request.url).origin;

    enqueueRun(
      gameId,
      () => runSimulation({
        gameId,
        scenario,
        scenarioId,
        difficulty,
        taskAgentType,
        redTeamType,
        task,
        origin,
        targetUrl: targetUrl ?? undefined,
      }),
    );

    return NextResponse.json({
      ok: true,
      gameId,
      redirectTo: `/live-run/${gameId}`,
    });
  } catch (error) {
    const status = error instanceof AccessError || error instanceof ValidationError
      ? error.status
      : error instanceof UnsafeTargetError
        ? 400
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status },
    );
  }
}
