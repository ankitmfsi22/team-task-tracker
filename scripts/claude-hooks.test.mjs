// Claude Code hook contract, verified against https://code.claude.com/docs/en/hooks:
// - hooks receive one JSON object on stdin: { hook_event_name, tool_name, tool_input, cwd, ... }
//   (Bash: tool_input.command; Read/Edit/Write: tool_input.file_path, always absolute).
// - exit code 2 blocks (PreToolUse) / prevents stopping (Stop) and stderr is fed back as the reason.
// - the Stop payload carries stop_hook_active (true when Claude already continues because of a Stop hook).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hook = (name) => join(root, '.claude', 'hooks', name);

const run = (script, payload, { env = {}, cwd = root } = {}) =>
  spawnSync('node', [hook(script)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    cwd,
    env: { ...process.env, ...env },
  });

const bash = (command) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Bash',
  tool_input: { command },
});
const file = (tool_name, file_path) => ({
  hook_event_name: 'PreToolUse',
  tool_name,
  tool_input: { file_path },
});

const expectBlocked = (script, payload) => {
  const result = run(script, payload);
  assert.equal(result.status, 2, `expected exit 2 for ${JSON.stringify(payload.tool_input)}`);
  assert.ok(result.stderr.trim().length > 0, 'a reason must be written to stderr');
};
const expectAllowed = (script, payload) => {
  const result = run(script, payload);
  assert.equal(result.status, 0, `expected exit 0 for ${JSON.stringify(payload.tool_input)}`);
};

test('S-DEV1002-05 secret reads are blocked', () => {
  for (const c of ['cat .env', 'less .env.local', 'grep KEY .env', 'source .env']) {
    expectBlocked('guard.mjs', bash(c));
  }
});

test('S-DEV1002-06 destructive git is blocked', () => {
  for (const c of [
    'git push --force',
    'git push -f',
    'git reset --hard',
    'git clean -fd',
    'git branch -D main',
    'git push origin main',
  ]) {
    expectBlocked('guard.mjs', bash(c));
  }
});

test('S-DEV1002-07 rm -rf is blocked', () => {
  expectBlocked('guard.mjs', bash('rm -rf dist'));
});

test('S-DEV1002-08 unpinned versions are blocked', () => {
  expectBlocked('guard.mjs', bash('pnpm add zod@latest'));
});

test('S-DEV1002-09 safety bypass flags are blocked', () => {
  expectBlocked('guard.mjs', bash('git commit --no-verify'));
  expectBlocked('guard.mjs', bash('claude --dangerously-skip-permissions'));
});

test('S-DEV1002-10 safe commands pass', () => {
  for (const c of [
    'git status',
    'pnpm test',
    'cat .env.example',
    'git push origin feature/claude/x',
    'rm file.txt',
  ]) {
    expectAllowed('guard.mjs', bash(c));
  }
});

test('S-DEV1002-11 file tools cannot touch .env files', () => {
  for (const tool of ['Read', 'Edit', 'Write']) {
    expectBlocked('guard.mjs', file(tool, join(root, '.env')));
    expectBlocked('guard.mjs', file(tool, join(root, 'backend', '.env.local')));
    expectAllowed('guard.mjs', file(tool, join(root, '.env.example')));
  }
});

test('S-DEV1002-12 changed file is formatted', () => {
  const dir = mkdtempSync(join(root, '.format-hook-'));
  try {
    const target = join(dir, 'sample.mjs');
    writeFileSync(target, 'const   a  =   1\n');
    for (const tool of ['Edit', 'Write']) {
      writeFileSync(target, 'const   a  =   1\n');
      const result = run('format.mjs', {
        hook_event_name: 'PostToolUse',
        tool_name: tool,
        tool_input: { file_path: target },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(readFileSync(target, 'utf8'), /^const a = 1;?\n$/);
    }
    const missing = run('format.mjs', {
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: join(dir, 'does-not-exist.mjs') },
    });
    assert.equal(missing.status, 0);
    assert.equal(run('format.mjs', { tool_name: 'Write', tool_input: {} }).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// A fake `pnpm` on PATH records every invocation and exits with the given code.
const fakePnpm = (exitCode) => {
  const dir = mkdtempSync(join(tmpdir(), 'fake-pnpm-'));
  const log = join(dir, 'calls.log');
  const bin = join(dir, 'pnpm');
  writeFileSync(
    bin,
    `#!/bin/sh\necho "$@" >> "${log}"\necho "gate failure output" >&2\nexit ${exitCode}\n`,
  );
  chmodSync(bin, 0o755);
  return { dir, log, env: { PATH: `${dir}${delimiter}${process.env.PATH}` } };
};

test('S-DEV1002-13 failing gates block stopping', () => {
  const fake = fakePnpm(1);
  try {
    const result = run(
      'stop.mjs',
      { hook_event_name: 'Stop', stop_hook_active: false },
      { env: fake.env },
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /gate failure output|typecheck|test/);
    assert.ok(existsSync(fake.log), 'the gate commands must have been run');
  } finally {
    rmSync(fake.dir, { recursive: true, force: true });
  }
});

test('S-DEV1002-14 no infinite loop', () => {
  const fake = fakePnpm(1);
  try {
    const result = run(
      'stop.mjs',
      { hook_event_name: 'Stop', stop_hook_active: true },
      { env: fake.env },
    );
    assert.equal(result.status, 0);
    assert.equal(existsSync(fake.log), false, 'no command may run when stop_hook_active is true');
  } finally {
    rmSync(fake.dir, { recursive: true, force: true });
  }
});
