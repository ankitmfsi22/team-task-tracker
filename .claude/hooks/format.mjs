#!/usr/bin/env node
// PostToolUse (Edit|Write): run prettier --write on the changed file. Never fails the turn.
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const file = JSON.parse(raw)?.tool_input?.file_path;
    if (file && existsSync(file) && statSync(file).isFile()) {
      spawnSync(
        join(root, 'node_modules', '.bin', 'prettier'),
        ['--write', '--ignore-unknown', '--log-level', 'silent', file],
        { cwd: root, stdio: 'ignore' },
      );
    }
  } catch {
    // ignore: formatting is best effort
  }
  process.exit(0);
});
