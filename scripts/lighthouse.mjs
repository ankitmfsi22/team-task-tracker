// Reproducible Lighthouse run against the PRODUCTION build.
//
//   pnpm build && pnpm perf:lighthouse [--label after] [--runs 3] [--pages home,not-found]
//
// It starts the built backend (backend/dist) and `vite preview` on private ports, drives a
// headless Chromium and runs Lighthouse for mobile and desktop. Reports go to
// lighthouse-reports/<label>/ (gitignored). The health endpoint does not use the database, so no
// Postgres is needed; the URL below is a placeholder. Add pages here when a ticket adds routes.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '..');
const BACKEND_PORT = 3101;
const PREVIEW_PORT = 4301;
const CHROME_PORT = 9341;
const ORIGIN = `http://localhost:${PREVIEW_PORT}`;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'not-found', path: '/no-such-page' },
];

const argValue = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
};
const label = argValue('label', 'run');
const runs = Number(argValue('runs', '1'));
const only = argValue('pages', '').split(',').filter(Boolean);
const outDir = path.join(root, 'lighthouse-reports', label);
mkdirSync(outDir, { recursive: true });

const children = [];
const start = (command, args, env) => {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  children.push(child);
  return child;
};

const waitFor = async (url) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not listening yet
    }
    await sleep(500);
  }
  throw new Error(`${url} did not come up`);
};

const median = (results) =>
  [...results].sort(
    (a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score,
  )[Math.floor(results.length / 2)];

const audit = async (url, formFactor) => {
  const flags = {
    port: CHROME_PORT,
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: CATEGORIES,
    disableStorageReset: true,
  };
  const results = [];
  for (let run = 0; run < runs; run++) {
    results.push(
      await lighthouse(url, flags, formFactor === 'desktop' ? desktopConfig : undefined),
    );
  }
  return median(results);
};

const summary = [];
const record = async (entry, formFactor) => {
  const result = await audit(`${ORIGIN}${entry.path}`, formFactor);
  const scores = Object.fromEntries(
    CATEGORIES.map((id) => [id, Math.round((result.lhr.categories[id].score ?? 0) * 100)]),
  );
  const file = `${entry.name}-${formFactor}`;
  const [json, html] = result.report;
  writeFileSync(path.join(outDir, `${file}.json`), json);
  writeFileSync(path.join(outDir, `${file}.html`), html);
  summary.push({ page: entry.name, formFactor, ...scores });
  console.log(file, JSON.stringify(scores));
};

try {
  start('node', ['backend/dist/server.js'], {
    NODE_ENV: 'production',
    PORT: String(BACKEND_PORT),
    DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    LOG_LEVEL: 'error',
    JWT_ACCESS_SECRET: 'lighthouse-only-jwt-secret-0123456789-abcdefghij',
    APP_ORIGIN: ORIGIN,
    COOKIE_SECURE: 'true',
  });
  start(
    'pnpm',
    [
      '--filter',
      'frontend',
      'exec',
      'vite',
      'preview',
      '--port',
      String(PREVIEW_PORT),
      '--strictPort',
    ],
    { VITE_API_PROXY_TARGET: `http://localhost:${BACKEND_PORT}` },
  );
  await waitFor(`http://localhost:${BACKEND_PORT}/api/health`);
  await waitFor(ORIGIN);

  const profile = mkdtempSync(path.join(outDir, 'profile-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    args: [`--remote-debugging-port=${CHROME_PORT}`],
  });
  try {
    for (const entry of PAGES.filter((item) => only.length === 0 || only.includes(item.name))) {
      for (const formFactor of ['mobile', 'desktop']) await record(entry, formFactor);
    }
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }

  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n| Page | Form factor | Performance | Accessibility | Best practices | SEO |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const row of summary) {
    console.log(
      `| ${row.page} | ${row.formFactor} | ${row.performance} | ${row.accessibility} | ${row['best-practices']} | ${row.seo} |`,
    );
  }
} finally {
  for (const child of children) child.kill();
}
