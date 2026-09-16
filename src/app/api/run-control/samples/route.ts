import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { enqueueRun } from '@/lib/run-engine/runtime';
import { assertApiAccess, assertSameOrigin, assertStartRateLimit, AccessError } from '@/lib/run-engine/request-security';
import { runSimulation } from '@/lib/run-engine/runner';
import { DIFFICULTY_STEP_LIMIT, getScenario, getTaskForDifficulty } from '@/lib/run-engine/scenarios';
import { saveSession } from '@/lib/run-engine/store';
import type { ArenaSession, StartSimulationRequest } from '@/lib/run-engine/types';

const presets: StartSimulationRequest[] = [
  {
    scenarioId: 'demo-shop',
    difficulty: 'easy',
    taskAgentType: 'safe-rule-based',
    redTeamType: 'static-scripted',
  },
  {
    scenarioId: 'demo-travel',
    difficulty: 'medium',
    taskAgentType: 'risk-aware',
    redTeamType: 'rule-based-adaptive',
  },
  {
    scenarioId: 'demo-help',
    difficulty: 'hard',
    taskAgentType: 'safe-rule-based',
    redTeamType: 'static-scripted',
  },
];

export async function POST(request: Request) {
  try {
    assertApiAccess(request);
    assertSameOrigin(request);
    assertStartRateLimit(request);
    const origin = new URL(request.url).origin;
    const gameIds: string[] = [];

  for (const preset of presets) {
    const scenario = getScenario(preset.scenarioId);
    const gameId = nanoid(12);
    const task = getTaskForDifficulty(preset.scenarioId, preset.difficulty);
    const startedAt = new Date().toISOString();

    const session: ArenaSession = {
      gameId,
      scenarioId: preset.scenarioId,
      scenarioLabel: scenario.label,
      scenarioPath: scenario.path,
      difficulty: preset.difficulty,
      startedAt,
      taskAgentType: preset.taskAgentType,
      redTeamType: preset.redTeamType,
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
      totalStepsPlanned: DIFFICULTY_STEP_LIMIT[preset.difficulty],
      taskAgentSteps: [],
      redTeamActions: [],
      eventsLog: [],
    };

    await saveSession(session);

    enqueueRun(
      gameId,
      () => runSimulation({
        gameId,
        scenario,
        scenarioId: preset.scenarioId,
        difficulty: preset.difficulty,
        taskAgentType: preset.taskAgentType,
        redTeamType: preset.redTeamType,
        task,
        origin,
      }),
    );

    gameIds.push(gameId);
  }

    return NextResponse.json({ ok: true, gameIds, count: presets.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: error instanceof AccessError ? error.status : 500 });
  }
}
