// settings.json hooks format per https://code.claude.com/docs/en/hooks:
// { hooks: { <Event>: [ { matcher, hooks: [ { type: 'command', command } ] } ] } }
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');
const lines = (...p) =>
  read(...p)
    .trimEnd()
    .split('\n').length;
const settings = () => JSON.parse(read('.claude', 'settings.json'));
const has = (list, needle) => list.some((entry) => entry.includes(needle));

test('S-DEV1002-01 safe commands are allowed', () => {
  const { allow } = settings().permissions;
  for (const needle of [
    'pnpm build',
    'pnpm lint',
    'pnpm typecheck',
    'pnpm test',
    'pnpm format:check',
    'pnpm spec:validate',
    'pnpm check:scenarios',
    'openspec',
    'git status',
    'git diff',
    'git log',
    'git add',
    'git commit',
    'context7',
    'linear-server__get_issue',
  ]) {
    assert.ok(has(allow, needle), `allow is missing ${needle}`);
  }
});

test('S-DEV1002-02 sensitive commands ask', () => {
  const { ask } = settings().permissions;
  for (const needle of [
    'git push',
    'pnpm add',
    'pnpm install',
    'docker compose',
    'gh pr create',
    'gh pr merge',
    'prisma migrate',
    'save_issue',
    'save_project',
    'save_comment',
  ]) {
    assert.ok(has(ask, needle), `ask is missing ${needle}`);
  }
});

test('S-DEV1002-03 secrets and destructive commands are denied', () => {
  const { deny } = settings().permissions;
  for (const needle of [
    'Read(./.env',
    'secrets',
    'curl',
    'git push --force',
    'git push -f',
    'git reset --hard',
    'rm -rf',
  ]) {
    assert.ok(has(deny, needle), `deny is missing ${needle}`);
  }
});

test('S-DEV1002-04 exactly three hooks are registered', () => {
  const { hooks } = settings();
  assert.deepEqual(Object.keys(hooks).sort(), ['PostToolUse', 'PreToolUse', 'Stop']);
  const commands = (event) => hooks[event].flatMap((g) => g.hooks.map((h) => h.command));
  const matchers = (event) => hooks[event].map((g) => g.matcher);
  assert.ok(matchers('PostToolUse').includes('Edit|Write'));
  assert.ok(matchers('PreToolUse').includes('Bash'));
  assert.ok(matchers('PreToolUse').includes('Read|Edit|Write'));
  assert.equal(hooks.PreToolUse.length, 2);
  assert.equal(hooks.PostToolUse.length, 1);
  assert.equal(hooks.Stop.length, 1);
  for (const event of Object.keys(hooks)) {
    for (const group of hooks[event]) {
      for (const h of group.hooks) assert.equal(h.type, 'command');
    }
    for (const command of commands(event)) {
      const match = command.match(/\.claude\/hooks\/[\w.-]+/);
      assert.ok(match, `no hook script in ${command}`);
      assert.ok(existsSync(join(root, match[0])), `${match[0]} does not exist`);
    }
  }
});

test('S-DEV1002-15 no other custom commands', () => {
  assert.deepEqual(readdirSync(join(root, '.claude', 'commands')).sort(), ['create-pr.md', 'opsx']);
});

test('S-DEV1002-16 create-pr covers the PR workflow', () => {
  const text = read('.claude', 'commands', 'create-pr.md');
  assert.match(text, /diff/i);
  assert.match(text, /Linear/);
  assert.match(text, /OpenSpec/i);
  assert.match(text, /scenario/i);
  assert.match(text, /test/i);
  assert.match(text, /git push/);
  assert.match(text, /gh pr create --base main/);
  assert.match(text, /(never|do not|don't|forbid)[^\n]*push[^\n]*main/i);
});

test('S-DEV1002-17 FRS is short and mapped', () => {
  const text = read('docs', 'FRS.md');
  assert.ok(lines('docs', 'FRS.md') <= 60);
  assert.match(text, /FR-/);
  for (const area of ['auth', 'project', 'task', 'comment', 'workflow']) {
    assert.match(text, new RegExp(area, 'i'), area);
  }
  assert.match(text, /DEV-10\d\d/);
  assert.match(text, /Linear[^\n]*authoritative|authoritative[^\n]*Linear/i);
});

test('S-DEV1002-18 layer files hold the key rules', () => {
  const files = [
    ['backend', 'CLAUDE.md'],
    ['frontend', 'CLAUDE.md'],
    ['packages', 'shared', 'CLAUDE.md'],
  ];
  for (const f of files) assert.ok(lines(...f) < 50, f.join('/'));
  const backend = read(...files[0]);
  assert.match(backend, /routes\s*(->|→)\s*controller\s*(->|→)\s*service\s*(->|→)\s*repository/i);
  assert.match(backend, /Prisma/);
  assert.match(backend, /repositor/i);
  assert.match(backend, /404/);
  assert.match(backend, /Swagger/i);
  const frontend = read(...files[1]);
  for (const re of [/TanStack Query/, /shadcn/i, /detail/i, /Lighthouse[^\n]*100/]) {
    assert.match(frontend, re);
  }
  const shared = read(...files[2]);
  assert.match(shared, /Zod/);
  assert.match(shared, /ESM/);
});

test('S-DEV1002-19 skills exist with front matter', () => {
  for (const name of ['spec-scenario-format', 'add-endpoint']) {
    const text = read('.claude', 'skills', name, 'SKILL.md');
    assert.match(text, /^---\n[\s\S]*?^name:\s*\S+/m);
    assert.match(text, /^description:\s*\S+/m);
    assert.ok(lines('.claude', 'skills', name, 'SKILL.md') < 60, name);
  }
});

test('S-DEV1002-20 instructions describe the new workflow', () => {
  assert.ok(lines('CLAUDE.md') < 100);
  assert.ok(lines('AGENTS.md') < 200);
  for (const file of ['CLAUDE.md', 'AGENTS.md']) {
    const text = read(file);
    for (const re of [
      /explore/i,
      /propose/i,
      /validate --strict/,
      /test-writer/i,
      /one commit per task/i,
      /reviewer/i,
      /\/create-pr/,
      /CI/,
      /merge/i,
      /sync/i,
      /archive/i,
      /review\.md/,
      /approvals\.md/,
    ]) {
      assert.match(text, re, `${file} ${re}`);
    }
  }
});

test('S-DEV1002-21 config carries the waiver', () => {
  const text = read('openspec', 'config.yaml');
  assert.match(text, /Approval[^\n]*waived[^\n]*senior/i);
  assert.doesNotMatch(text, /Approval[^\n]*requires[^\n]*approved/i);
  assert.match(text, /checkpoint/i);
  assert.match(text, /approvals\.md/);
  assert.match(text, /review\.md/);
});
