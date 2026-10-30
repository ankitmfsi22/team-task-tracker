import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'ticket-source.mjs');
const LABEL = 'FIXTURE - NOT LIVE LINEAR DATA';
const valid = { source: LABEL, id: 'DEV-77', title: 'Sample ticket', status: 'Todo' };

const cli = (id) => spawnSync('node', [script, id], { cwd: root, encoding: 'utf8' });
const tempDir = (name, content) => {
  const dir = mkdtempSync(join(tmpdir(), 'ticket-source-'));
  writeFileSync(join(dir, `${name}.fixture.json`), content);
  return dir;
};
const load = async (id, dir) => {
  const { loadTicket } = await import('./ticket-source.mjs');
  return loadTicket(id, { dir });
};
const failure = async (fn) => {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  assert.fail('expected an error');
};

test('S-DEV1004-07 loader labels its output', () => {
  const r = cli('DEV-5');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout.split('\n')[0], /FIXTURE/);
  assert.match(r.stdout.split('\n')[0], /not live/i);
  assert.match(r.stdout, /DEV-5/);
  assert.match(r.stdout, /title/i);
  assert.match(r.stdout, /status/i);
});

test('S-DEV1004-08 malformed fixture gives a clear error', async () => {
  for (const [name, content, problem] of [
    ['DEV-77', '{ not json', /json|parse|invalid/i],
    ['DEV-78', JSON.stringify({ ...valid, id: 'DEV-78', title: undefined }), /title/i],
    ['DEV-79', JSON.stringify({ ...valid, id: 'DEV-79', status: undefined }), /status/i],
    ['DEV-80', JSON.stringify({ ...valid, id: undefined }), /\bid\b/i],
  ]) {
    const dir = tempDir(name, content);
    const error = await failure(() => load(name, dir));
    assert.match(error.message, new RegExp(`${name}\\.fixture\\.json`));
    assert.match(error.message, problem);
    assert.doesNotMatch(error.message, /Sample ticket/);
  }
});

test('S-DEV1004-09 missing ticket is an error, not fabricated data', () => {
  const r = cli('DEV-99999');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /ticket not found/i);
  assert.doesNotMatch(r.stdout, /title|status|description/i);
});

test('S-DEV1004-10 fixture is never shown as live', async () => {
  for (const source of ['Linear', undefined, 'FIXTURE']) {
    const dir = tempDir('DEV-77', JSON.stringify({ ...valid, source }));
    const error = await failure(() => load('DEV-77', dir));
    assert.match(error.message, /source/i);
  }
  const out = cli('DEV-5').stdout;
  assert.match(out, /FIXTURE/);
  assert.doesNotMatch(out.replace(/not live linear data/gi, ''), /\blive\b/i);
});
