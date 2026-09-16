import type {
  Difficulty,
  RedTeamType,
  StartSimulationRequest,
  TaskAgentType,
} from './types';

const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const TASK_AGENTS = new Set<TaskAgentType>(['naive', 'safe-rule-based', 'risk-aware', 'llm-policy']);
const RED_TEAMS = new Set<RedTeamType>(['static-scripted', 'rule-based-adaptive', 'llm-red-team']);

export class ValidationError extends Error {
  readonly status = 400;
}

function optionalString(value: unknown, name: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new ValidationError(`${name} must be a string.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new ValidationError(`${name} must be at most ${maxLength} characters.`);
  return normalized || undefined;
}

export function parseStartRequest(value: unknown): StartSimulationRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const input = value as Record<string, unknown>;
  const difficulty = input.difficulty ?? 'easy';
  const taskAgentType = input.taskAgentType ?? 'llm-policy';
  const redTeamType = input.redTeamType ?? 'llm-red-team';

  if (!DIFFICULTIES.has(difficulty as Difficulty)) throw new ValidationError('Invalid difficulty.');
  if (!TASK_AGENTS.has(taskAgentType as TaskAgentType)) throw new ValidationError('Invalid taskAgentType.');
  if (!RED_TEAMS.has(redTeamType as RedTeamType)) throw new ValidationError('Invalid redTeamType.');

  return {
    scenarioId: 'live-web',
    difficulty: difficulty as Difficulty,
    taskAgentType: taskAgentType as TaskAgentType,
    redTeamType: redTeamType as RedTeamType,
    targetUrl: optionalString(input.targetUrl, 'targetUrl', 2_048),
    customTask: optionalString(input.customTask, 'customTask', 1_000),
  };
}

export function assertGameId(gameId: string): string {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(gameId)) throw new ValidationError('Invalid session id.');
  return gameId;
}

export function assertScreenshotFilename(filename: string): string {
  if (!/^step-\d{2}-\d{3}-(?:initial|pre-action|post-attack|post-action)\.png$/.test(filename)) {
    throw new ValidationError('Invalid screenshot filename.');
  }
  return filename;
}
