import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repo, 'scripts', 'check-changes.mjs');

const WAIVER =
  "Human gate waived on senior's instruction; spec checked by openspec validate --strict + reviewer sub-agent";
const PENDING = 'Status: PENDING human Gate 1 (batch approval)';
// Ids are assembled at runtime so this file holds no literal scenario id outside test titles.
const sid = (ticket, n) => `S-DEV${ticket}-${String(n).padStart(2, '0')}`;

const lines = (n, head = '') =>
  [head, ...Array.from({ length: n - (head ? 1 : 0) }, () => 'x')]
    .filter((l, i) => i > 0 || l !== '')
    .join('\n');

// Builds a temp repo root with one change (active unless `archived`) and a README status table.
const fixture = ({
  ticket = 1005,
  slug = 'demo',
  archived = false,
  proposal,
  design,
  tasks = '- [ ] 1.1 x\n',
  approvals = WAIVER,
  review = 'Verdict: PASS\n',
  scenarioTicket = ticket,
  readmeRow,
} = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'check-changes-'));
  const name = `dev-${ticket}-${slug}`;
  const folder = archived ? `2026-10-30-${name}` : name;
  const dir = join(root, 'openspec', 'changes', ...(archived ? ['archive'] : []), folder);
  mkdirSync(join(dir, 'specs', 'cap'), { recursive: true });
  const linear = `https://linear.app/team/issue/DEV-${ticket - 1000 + 4}`;
  const put = (file, text) => text !== null && writeFileSync(join(dir, file), text);
  put('proposal.md', proposal ?? `## Why\nx\nLinear: ${linear}\n`);
  if (design !== undefined) put('design.md', design);
  put('tasks.md', tasks);
  put('approvals.md', approvals);
  put('review.md', review);
  writeFileSync(
    join(dir, 'specs', 'cap', 'spec.md'),
    `## Purpose\nx\n\n## ADDED Requirements\n\n### Requirement: R\nThe system SHALL x.\n\n#### Scenario: ${sid(scenarioTicket, 1)} t\n- WHEN a\n- THEN b\n`,
  );
  const row =
    readmeRow ??
    `| DEV-${ticket} demo | [DEV-${ticket - 1000 + 4}](${linear}) | \`${name}\`${archived ? ` (archived \`${folder}\`)` : ''} | ${archived ? '[#1](https://github.com/o/r/pull/1)' : '-'} | Done |`;
  writeFileSync(
    join(root, 'README.md'),
    `# R\n\n## Ticket status\n\n| Ticket | Linear | OpenSpec change | PR | Status |\n| --- | --- | --- | --- | --- |\n${row}\n`,
  );
  return { root, dir, name, folder };
};

const run = (root, ...flags) =>
  spawnSync('node', [script, '--root', root, ...flags], { encoding: 'utf8' });
const out = (r) => `${r.stdout}${r.stderr}`;
const failsNaming = (r, what) => {
  assert.equal(r.status, 1, out(r));
  assert.ok(out(r).includes(what), out(r));
};

test('S-DEV1005-01 Every installed command is documented', () => {
  const dir = join(repo, '.claude', 'commands', 'opsx');
  const names = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  assert.ok(names.length >= 12, 'expected the opsx commands');
  const readme = readFileSync(join(repo, 'README.md'), 'utf8');
  const section = readme.split(/^## Workflow$/m)[1]?.split(/^## /m)[0] ?? '';
  assert.ok(section.length > 0, 'README has a Workflow section');
  for (const name of names) assert.ok(section.includes(`/opsx:${name}`), `/opsx:${name}`);
});

test('S-DEV1005-02 Profile and global config are documented', () => {
  const readme = readFileSync(join(repo, 'README.md'), 'utf8');
  const section = readme.split(/^## Workflow$/m)[1]?.split(/^## /m)[0] ?? '';
  assert.ok(section.includes('openspec config profile'));
  assert.ok(section.includes('openspec update'));
  assert.match(section, /config\.json/);
});

test('S-DEV1005-03 Long proposal fails', () => {
  const linear = 'Linear: https://linear.app/team/issue/DEV-9';
  const ok = fixture({ proposal: `${lines(14)}\n${linear}\n` });
  assert.equal(run(ok.root).status, 0, out(run(ok.root)));
  const bad = fixture({ proposal: `${lines(15)}\n${linear}\n` });
  failsNaming(run(bad.root), 'proposal.md');
});

test('S-DEV1005-04 Proposal without Linear link fails', () => {
  failsNaming(run(fixture({ proposal: '## Why\nno link\n' }).root), 'proposal.md');
  const wrong = fixture({ proposal: 'Linear: https://linear.app/team/issue/DEV-10\n' });
  failsNaming(run(wrong.root), 'proposal.md');
});

test('S-DEV1005-05 Long design fails', () => {
  assert.equal(run(fixture({ design: lines(35) }).root).status, 0);
  failsNaming(run(fixture({ design: lines(36) }).root), 'design.md');
});

test('S-DEV1005-06 Missing tasks fails', () => {
  failsNaming(run(fixture({ tasks: null }).root), 'tasks.md');
});

test('S-DEV1005-07 Missing approvals fails', () => {
  failsNaming(run(fixture({ approvals: null }).root), 'approvals.md');
});

test('S-DEV1005-08 Accepted forms pass', () => {
  for (const approvals of [
    'Approved by Ankit Singh on 2026-10-30\n',
    'Bootstrap change, no human gate: change predates the workflow\n',
    `${WAIVER}\n`,
  ]) {
    const r = run(fixture({ approvals }).root);
    assert.equal(r.status, 0, `${approvals}: ${out(r)}`);
  }
});

test('S-DEV1005-09 Unrecognised approval fails', () => {
  failsNaming(run(fixture({ approvals: 'approved\n' }).root), 'approvals.md');
});

test('S-DEV1005-10 Pending is allowed only while draft', () => {
  const { root } = fixture({ approvals: `${PENDING}\n` });
  assert.equal(run(root).status, 0, out(run(root)));
  failsNaming(run(root, '--ready'), 'approvals.md');
});

test('S-DEV1005-11 Missing verdict fails when ready', () => {
  const { root } = fixture({ review: '# Review log\n' });
  assert.equal(run(root).status, 0, out(run(root)));
  failsNaming(run(root, '--ready'), 'review.md');
});

test('S-DEV1005-12 Archived change needs verdict and review', () => {
  failsNaming(run(fixture({ archived: true, review: '# Review log\n' }).root), 'review.md');
  failsNaming(run(fixture({ archived: true, review: null }).root), 'review.md');
  const ok = run(fixture({ archived: true }).root);
  assert.equal(ok.status, 0, out(ok));
});

test('S-DEV1005-13 Foreign scenario id fails', () => {
  const { root } = fixture({ scenarioTicket: 1006 });
  failsNaming(run(root), 'spec.md');
  assert.ok(out(run(root)).includes(sid(1006, 1)), out(run(root)));
});

test('S-DEV1005-14 Unlisted change fails', () => {
  const { root, name } = fixture({
    readmeRow: '| DEV-1099 other | x | `dev-1099-other` | - | Todo |',
  });
  failsNaming(run(root), name);
});

test('S-DEV1005-15 Archived row needs Linear and PR links', () => {
  const linear = '[DEV-9](https://linear.app/team/issue/DEV-9)';
  const noPr = fixture({
    archived: true,
    readmeRow: `| DEV-1005 demo | ${linear} | \`dev-1005-demo\` | - | Done |`,
  });
  failsNaming(run(noPr.root), noPr.name);
  const noLinear = fixture({
    archived: true,
    readmeRow:
      '| DEV-1005 demo | - | `dev-1005-demo` | [#1](https://github.com/o/r/pull/1) | Done |',
  });
  failsNaming(run(noLinear.root), noLinear.name);
});

test('S-DEV1005-16 Archived DEV-1002 passes', () => {
  const r = run(repo);
  assert.equal(r.status, 0, out(r));
  assert.ok(out(r).includes('dev-1002-claude-code-setup'), out(r));
});

test('S-DEV1005-17 Script is wired', () => {
  const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
  assert.match(pkg.scripts['check:changes'] ?? '', /check-changes\.mjs/);
  assert.match(pkg.scripts['test:tooling'], /scripts\/\*\*\/\*\.test\.mjs/);
  const ci = readFileSync(join(repo, '.github', 'workflows', 'ci.yml'), 'utf8');
  const verify = ci.split(/^ {2}commits:$/m)[0] ?? '';
  assert.match(verify, /pnpm check:changes/);
});
