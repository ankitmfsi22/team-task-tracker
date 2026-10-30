import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const readJson = (path) => JSON.parse(read(path));

const PACKAGES = ['backend', 'frontend', 'packages/shared'];
const MANIFESTS = ['package.json', ...PACKAGES.map((dir) => `${dir}/package.json`)];

test('docker-compose pins a PostgreSQL 16.x image for the dev and test databases', () => {
  const compose = read('docker-compose.yml');
  const images = [...compose.matchAll(/^\s+image:\s*(postgres:\S+)\s*$/gm)].map(
    (match) => match[1],
  );
  assert.equal(images.length, 3); // db-dev, db-test and the db of the full profile
  for (const image of images) assert.match(image, /^postgres:16\.\d+(?:\.\d+)?-[a-z]+$/);
  assert.match(compose, /^ {2}db-dev:/m);
  assert.match(compose, /^ {2}db-test:/m);
});

test('the pnpm workspace contains backend, frontend and packages/shared', () => {
  const workspace = read('pnpm-workspace.yaml');
  const block = workspace.split(/^packages:\n/m)[1]?.split(/^\S/m)[0] ?? '';
  const globs = [...block.matchAll(/^ {2}- (\S+)$/gm)].map((match) => match[1]);
  for (const glob of ['backend', 'frontend', 'packages/*']) assert.ok(globs.includes(glob), glob);

  const names = PACKAGES.map((dir) => readJson(`${dir}/package.json`).name);
  assert.deepEqual(names, ['backend', 'frontend', '@team-task-tracker/shared']);
});

test('every tool and dependency version is exact, with no ranges and no @latest', () => {
  const EXACT = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;
  for (const manifest of MANIFESTS) {
    const json = readJson(manifest);
    for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const [name, version] of Object.entries(json[section] ?? {})) {
        assert.ok(
          version === 'workspace:*' || EXACT.test(version),
          `${manifest}: ${name}@${version}`,
        );
      }
    }
    for (const [script, command] of Object.entries(json.scripts ?? {})) {
      assert.ok(!command.includes('@latest'), `${manifest}: script ${script} uses @latest`);
    }
  }
  assert.match(readJson('package.json').packageManager, /^pnpm@\d+\.\d+\.\d+$/);
  assert.match(read('pnpm-workspace.yaml'), /^savePrefix: ''$/m);
  assert.match(read('.nvmrc'), /^\d+\.\d+\.\d+\s*$/);
});

test('the root build runs the shared package before the packages that depend on it', () => {
  const result = spawnSync(
    'pnpm',
    [
      '-r',
      '--workspace-concurrency=1',
      'exec',
      'node',
      '-p',
      'JSON.parse(require("fs").readFileSync("package.json","utf8")).name',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const order = result.stdout.split('\n').map((line) => line.trim());

  for (const dir of PACKAGES) {
    const manifest = readJson(`${dir}/package.json`);
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      if (!dependency.startsWith('@team-task-tracker/')) continue;
      assert.ok(
        order.includes(dependency) && order.includes(manifest.name),
        `${dir} and ${dependency}`,
      );
      assert.ok(
        order.indexOf(dependency) < order.indexOf(manifest.name),
        `${dependency} before ${manifest.name}`,
      );
    }
  }
  assert.equal(readJson('package.json').scripts.build, 'pnpm -r run build');
});

test('every package with tests enforces an 80% coverage threshold', () => {
  for (const dir of PACKAGES) {
    const config = read(`${dir}/vitest.config.ts`);
    assert.match(config, /provider:\s*'v8'/, dir);
    assert.match(
      config,
      /thresholds:\s*\{\s*lines:\s*80,\s*functions:\s*80,\s*branches:\s*80,\s*statements:\s*80\s*\}/,
      dir,
    );
    assert.equal(readJson(`${dir}/package.json`).scripts.test, 'vitest run', dir);
  }
});

const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|password|passwd|token)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  /\bsk-[A-Za-z0-9]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
];

test('Context7 and Linear are configured in .mcp.json without secrets', () => {
  const mcp = readJson('.mcp.json');
  const context7 = mcp.mcpServers.context7;
  assert.equal(context7.command, 'npx');
  assert.ok(context7.args.some((arg) => /^@upstash\/context7-mcp@\d+\.\d+\.\d+$/.test(arg)));
  assert.ok(mcp.mcpServers['linear-server']);
  for (const [name, server] of Object.entries(mcp.mcpServers)) {
    assert.equal(server.env, undefined, `${name} must not carry env values`);
    assert.equal(server.headers, undefined, `${name} must not carry headers`);
  }
  for (const pattern of SECRET_PATTERNS)
    assert.doesNotMatch(read('.mcp.json'), pattern, '.mcp.json looks like it holds a secret');
});

test('AGENTS.md and CLAUDE.md exist within their line limits', () => {
  const limits = { 'AGENTS.md': 60, 'CLAUDE.md': 60 };
  for (const [file, limit] of Object.entries(limits)) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`);
    const lines = read(file).trimEnd().split('\n').length;
    assert.ok(lines < limit, `${file} has ${lines} lines, the limit is under ${limit}`);
  }
  assert.equal(read('CLAUDE.md').split('\n')[1], '@AGENTS.md');
});
