import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');
const NAMES = [
  'reviewer',
  'test-writer',
  'db-change-checker',
  'security-auditor',
  'implementer',
  'coordinator',
];

const parse = (name) => {
  const text = read('.claude', 'agents', `${name}.md`);
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  assert.ok(m, `${name} has no frontmatter`);
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: m[2], text };
};
const tools = (name) => {
  const raw = parse(name)
    .fm.tools.replace(/^\[|\]$/g, '')
    .trim();
  // split on commas that are not inside parentheses
  return raw
    .split(/,(?![^()]*\))/)
    .map((t) => t.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
};

test('S-DEV1003-01 All six agent files have required frontmatter', () => {
  const dir = join(root, '.claude', 'agents');
  assert.ok(existsSync(dir), '.claude/agents is missing');
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.deepEqual(files.sort(), NAMES.map((n) => `${n}.md`).sort());
  for (const n of NAMES) {
    const { fm } = parse(n);
    assert.equal(fm.name, n);
    assert.ok(fm.description, `${n} description empty`);
    assert.ok(fm.tools, `${n} tools missing`);
    assert.ok(fm.model, `${n} model missing`);
  }
});

test('S-DEV1003-02 Tool lists follow least privilege', () => {
  assert.deepEqual(tools('db-change-checker'), ['Read', 'Grep']);
  assert.deepEqual(tools('security-auditor'), ['Read', 'Grep', 'Bash']);
});

test('S-DEV1003-03 Reviewer has no write tools', () => {
  const t = tools('reviewer');
  for (const need of [
    'Read',
    'Grep',
    'Glob',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(pnpm test:*)',
  ]) {
    assert.ok(t.includes(need), `reviewer missing ${need}`);
  }
  for (const bad of ['Write', 'Edit', 'NotebookEdit']) {
    assert.ok(!t.includes(bad), `reviewer must not have ${bad}`);
  }
});

test('S-DEV1003-04 Reviewer ignores implementer summary', () => {
  const { body } = parse('reviewer');
  assert.match(body, /git diff/);
  assert.match(body, /run the tests (yourself|itself)|run (the )?tests yourself/i);
  assert.match(body, /(not|never|must not) rely on the implementer'?s summary/i);
  assert.match(body, /coordinator/i);
  assert.match(body, /review\.md/);
});

test('S-DEV1003-05 Test-writer description forbids editing implementation', () => {
  const { fm, body } = parse('test-writer');
  assert.match(fm.description, /(not|never|must not) (edit|touch|modify)[^.]*implementation/i);
  assert.match(body, /(not|never|must not) (edit|touch|modify)[^.]*implementation/i);
  assert.match(body, /spec scenarios only/i);
  assert.deepEqual(tools('test-writer'), ['Read', 'Write', 'Bash']);
});

test('S-DEV1003-06 Implementer commits per task', () => {
  const { body } = parse('implementer');
  assert.match(body, /one commit per task/i);
  assert.match(body, /tests first/i);
  for (const gate of ['build', 'lint', 'typecheck', 'test']) {
    assert.match(body, new RegExp(gate, 'i'), `implementer missing gate ${gate}`);
  }
});

test('S-DEV1003-07 Coordinator flow', () => {
  const { body } = parse('coordinator');
  for (const step of [
    /Linear/,
    /explore/i,
    /propose/i,
    /apply/i,
    /test-writer/,
    /verify/i,
    /reviewer/,
    /\/create-pr/,
    /CI/,
    /merge/i,
    /sync/i,
    /archive/i,
    /one sub-agent per stage/i,
  ]) {
    assert.match(body, step, `coordinator body missing ${step}`);
  }
});

test('S-DEV1003-08 AGENTS-SETUP lists all six agents', () => {
  const doc = read('docs', 'AGENTS-SETUP.md');
  for (const n of NAMES) assert.ok(doc.includes(n), `missing ${n}`);
  const header = doc.split('\n').find((l) => /^\|.*agent.*\|/i.test(l));
  assert.ok(header, 'no table header');
  for (const col of ['agent', 'scope', 'permitted actions', 'expected output', 'restrictions']) {
    assert.ok(header.toLowerCase().includes(col), `column ${col} missing`);
  }
  const ev = doc.split(/^#+\s*Evidence/im)[1];
  assert.ok(ev, 'no Evidence section');
  for (const n of NAMES) assert.ok(ev.includes(n), `evidence missing ${n}`);
  assert.ok(doc.split('\n').length <= 80, 'doc exceeds one page');
});

test('S-DEV1003-09 Apply guidance names test-writer', () => {
  const cfg = read('openspec', 'config.yaml');
  const apply = cfg.slice(cfg.indexOf('operations:'));
  assert.match(apply, /test-writer/);
  assert.match(apply, /commit(s)? (once )?per task/i);
  const claude = read('CLAUDE.md');
  assert.match(claude, /apply[^\n]*test-writer/i);
  assert.match(claude, /commit(s)? (once )?per task/i);
});

test('S-DEV1003-10 Retro DEV-1001 folder is complete', () => {
  const dir = ['openspec', 'changes', 'archive', '2026-10-30-dev-1001-project-setup'];
  assert.match(read(...dir, 'proposal.md'), /RETROACTIVE/);
  assert.ok(read(...dir, 'approvals.md').startsWith('Bootstrap change, no human gate:'));
  const review = read(...dir, 'review.md');
  assert.match(review, /reviewer/i);
  assert.match(review, /c12dd3d/);
});

test('S-DEV1003-11 AGENTS-SETUP states the enforcement limits and the post-run git status check', () => {
  const doc = read('docs', 'AGENTS-SETUP.md');
  assert.match(doc, /Enforcement limits/);
  assert.match(doc, /disallowedTools/);
  assert.match(doc, /prompt-level/);
  assert.match(doc, /pnpm test:\*/);
  assert.match(doc, /git status --porcelain/);
  assert.match(parse('coordinator').body, /git status --porcelain/);
  assert.match(parse('reviewer').fm.disallowedTools, /Write, Edit, NotebookEdit/);
});
