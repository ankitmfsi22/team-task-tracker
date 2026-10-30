// Labelled fixture fallback for Linear tickets (used only when the live MCP server is unavailable).
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const FIXTURE_LABEL = 'FIXTURE - NOT LIVE LINEAR DATA';
const defaultDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'linear');

const schema = z.object({
  source: z.literal(FIXTURE_LABEL),
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.string().min(1),
});

export const MAX_FIXTURE_BYTES = 1024 * 1024;
const ID_PATTERN = /^DEV-\d+$/;

export class TicketNotFoundError extends Error {}

export function loadTicket(id, { dir = defaultDir } = {}) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new TicketNotFoundError('ticket not found: invalid ticket id');
  }
  const file = `${id}.fixture.json`;
  let raw;
  try {
    if (statSync(join(dir, file)).size > MAX_FIXTURE_BYTES) {
      throw new Error(`${file}: fixture too large (max ${MAX_FIXTURE_BYTES} bytes)`);
    }
    raw = readFileSync(join(dir, file), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw new TicketNotFoundError(`ticket not found: ${file}`);
    throw error;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${file}: invalid JSON (${error.message})`, { cause: error });
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    const problems = result.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    throw new Error(`${file}: ${problems.join('; ')}`);
  }
  if (result.data.id !== id) {
    throw new Error(`${file}: id does not match the requested ticket id`);
  }
  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const t = loadTicket(process.argv[2] ?? '');
    console.log(`${FIXTURE_LABEL}`);
    console.log(`id: ${t.id}`);
    console.log(`title: ${t.title}`);
    console.log(`status: ${t.status}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
