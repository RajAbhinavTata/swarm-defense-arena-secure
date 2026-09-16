import { promises as fs } from 'fs';
import path from 'path';
import type { ArenaSession } from './types';
import { assertGameId } from './validation';

const DATA_ROOT = path.join(process.cwd(), '.arena-data');
const SESSIONS_DIR = path.join(DATA_ROOT, 'sessions');
const SCREENSHOTS_DIR = path.join(DATA_ROOT, 'screens');

async function ensureDirs(): Promise<void> {
  await Promise.all([
    fs.mkdir(DATA_ROOT, { recursive: true }),
    fs.mkdir(SESSIONS_DIR, { recursive: true }),
    fs.mkdir(SCREENSHOTS_DIR, { recursive: true }),
  ]);
}

function sessionFile(gameId: string): string {
  return path.join(SESSIONS_DIR, `${assertGameId(gameId)}.json`);
}

export function screenshotDir(gameId: string): string {
  return path.join(SCREENSHOTS_DIR, assertGameId(gameId));
}

export async function saveSession(session: ArenaSession): Promise<void> {
  await ensureDirs();
  const destination = sessionFile(session.gameId);
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(session, null, 2), { encoding: 'utf8', flag: 'wx' });
  await fs.rename(temporary, destination).catch(async (error: NodeJS.ErrnoException) => {
    if (process.platform === 'win32' && error.code === 'EEXIST') {
      await fs.rm(destination, { force: true });
      await fs.rename(temporary, destination);
      return;
    }
    await fs.rm(temporary, { force: true });
    throw error;
  });
}

export async function getSession(gameId: string): Promise<ArenaSession | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(sessionFile(gameId), 'utf8');
    return JSON.parse(raw) as ArenaSession;
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') throw error;
    return null;
  }
}

export async function getScreenshot(gameId: string, filename: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(screenshotDir(gameId), filename));
  } catch {
    return null;
  }
}

export async function updateSession(
  gameId: string,
  updater: (session: ArenaSession) => ArenaSession,
): Promise<ArenaSession | null> {
  const current = await getSession(gameId);
  if (!current) {
    return null;
  }
  const next = updater(current);
  await saveSession(next);
  return next;
}

export async function listSessions(): Promise<ArenaSession[]> {
  await ensureDirs();
  const files = await fs.readdir(SESSIONS_DIR);
  const sessions: ArenaSession[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue;
    }

    try {
      const raw = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf8');
      sessions.push(JSON.parse(raw) as ArenaSession);
    } catch {
      // Skip invalid file.
    }
  }

  return sessions.sort((a, b) => {
    const aTs = new Date(a.startedAt).getTime();
    const bTs = new Date(b.startedAt).getTime();
    return bTs - aTs;
  });
}

export async function removeAllSessions(): Promise<void> {
  await ensureDirs();
  const files = await fs.readdir(SESSIONS_DIR);

  await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map((file) => fs.unlink(path.join(SESSIONS_DIR, file))),
  );
}
