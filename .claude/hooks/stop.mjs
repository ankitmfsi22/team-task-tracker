#!/usr/bin/env node
// Stop hook: run pnpm typecheck and pnpm test; exit 2 (keep working) on failure.
// stop_hook_active is true when Claude already continues because of a Stop hook: exit 0 to avoid loops.
import { spawnSync } from 'node:child_process';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    // treat unreadable input as a normal Stop
  }
  if (payload.stop_hook_active) process.exit(0);
  for (const script of ['typecheck', 'test']) {
    const result = spawnSync('pnpm', [script], {
      cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status !== 0) {
      const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
        .trim()
        .split('\n')
        .slice(-40)
        .join('\n');
      process.stderr.write(`pnpm ${script} failed; fix it before stopping.\n${out}\n`);
      process.exit(2);
    }
  }
  process.exit(0);
});
