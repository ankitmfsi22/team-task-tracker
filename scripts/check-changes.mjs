// Checks the OpenSpec change workflow (DEV-1005): size limits, Linear link, approvals, review
// verdict, scenario ids and the README status table.
// Usage: node scripts/check-changes.mjs [--root <dir>] [--ready]
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const rootFlag = args.indexOf('--root');
const root = resolve(
  rootFlag > -1 ? (args[rootFlag + 1] ?? '') : join(dirname(fileURLToPath(import.meta.url)), '..'),
);
const ready = args.includes('--ready');

const WAIVER =
  "Human gate waived on senior's instruction; spec checked by openspec validate --strict + reviewer sub-agent";
const PENDING = 'Status: PENDING human Gate 1 (batch approval)';
const APPROVED = /^Approved by .+ on \d{4}-\d{2}-\d{2}\b/;
const BOOTSTRAP = /^Bootstrap change, no human gate: .+/;
const VERDICT = /^[\s*_#>-]*Verdict[^:\n]*:/im;
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

const errors = [];
const checked = [];
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);
const lineCount = (text) => text.replace(/\n+$/, '').split('\n').length;
const dirsIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const changesDir = join(root, 'openspec', 'changes');
const changes = [
  ...dirsIn(changesDir)
    .filter((n) => n !== 'archive')
    .map((n) => ({ folder: n, dir: join(changesDir, n), archived: false })),
  ...dirsIn(join(changesDir, 'archive')).map((n) => ({
    folder: n,
    dir: join(changesDir, 'archive', n),
    archived: true,
  })),
];

const readme = read(join(root, 'README.md')) ?? '';
const rows = readme.split('\n').filter((l) => l.trimStart().startsWith('|'));

for (const { folder, dir, archived } of changes) {
  const name = folder.replace(DATE_PREFIX, '');
  const ticket = /^dev-(\d{4})-/.exec(name)?.[1];
  const fail = (file, msg) => errors.push(`${folder}/${file}: ${msg}`);
  const strict = ready || archived;
  checked.push(folder);
  if (!ticket) fail('', 'folder name must be dev-<nnnn>-<slug>');

  const proposal = read(join(dir, 'proposal.md'));
  if (proposal === null) fail('proposal.md', 'missing');
  else {
    if (lineCount(proposal) > 15) fail('proposal.md', `${lineCount(proposal)} lines, max 15`);
    const want = ticket ? Number(ticket) - 1000 + 4 : null;
    const ids = [...proposal.matchAll(/linear\.app\/[^\s)]*\/issue\/DEV-(\d+)\b/g)].map((m) =>
      Number(m[1]),
    );
    if (!ids.includes(want)) fail('proposal.md', `needs a Linear issue URL for DEV-${want}`);
  }

  const design = read(join(dir, 'design.md'));
  if (design !== null && lineCount(design) > 35)
    fail('design.md', `${lineCount(design)} lines, max 35`);
  if (read(join(dir, 'tasks.md')) === null) fail('tasks.md', 'missing');

  const approvals = read(join(dir, 'approvals.md'));
  if (approvals === null) fail('approvals.md', 'missing');
  else {
    const text = approvals.trim();
    const first = text.split('\n')[0] ?? '';
    if (text === PENDING) {
      if (strict) fail('approvals.md', 'Gate 1 still PENDING');
    } else if (!(APPROVED.test(first) || BOOTSTRAP.test(first) || text === WAIVER)) {
      fail('approvals.md', 'unrecognised approval form');
    }
  }

  const review = read(join(dir, 'review.md'));
  if (review === null) {
    if (strict) fail('review.md', 'missing');
  } else if (strict && !VERDICT.test(review)) fail('review.md', 'no Verdict: line');

  for (const file of existsSync(join(dir, 'specs')) ? walk(join(dir, 'specs')) : []) {
    if (!file.endsWith('.md')) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/^####\s+Scenario:\s*S-DEV(\d{4})-(\d{2})\b/gm)) {
      if (m[1] !== ticket)
        fail(relative(dir, file), `scenario S-DEV${m[1]}-${m[2]} does not belong to DEV-${ticket}`);
    }
  }

  const row = rows.find((r) => r.includes(name));
  if (!row) fail('', `not listed in the README status table (${name})`);
  else {
    if (!row.includes('linear.app')) fail('', `README row of ${name} lacks a linear.app link`);
    if (archived && !row.includes('/pull/')) fail('', `README row of ${name} lacks a /pull/ link`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `check-changes: ${checked.length} change(s) ok${checked.length ? `: ${checked.join(', ')}` : ''}`,
);
