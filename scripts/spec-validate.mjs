// Runs `openspec validate --all --strict`. With no specs and no active changes the CLI has nothing
// to validate and may exit non-zero, so that case is reported and skipped.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const entries = (dir) => {
  const path = join(root, 'openspec', dir);
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && entry.name !== 'archive',
  );
};

if (entries('specs').length + entries('changes').length === 0) {
  process.stdout.write('spec:validate: no specs or active changes yet, nothing to validate\n');
  process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'openspec', 'validate', '--all', '--strict'], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
