import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');
const mcp = () => JSON.parse(read('.mcp.json')).mcpServers;

test('S-DEV1004-01 servers declared without secrets', () => {
  const servers = mcp();
  const linear = Object.values(servers).find((s) => s.url === 'https://mcp.linear.app/mcp');
  assert.ok(linear, 'Linear server url missing');
  assert.equal(linear.type, 'http');
  const context7 = Object.entries(servers).find(([name, s]) =>
    `${name} ${(s.args ?? []).join(' ')}`.includes('context7'),
  );
  assert.ok(context7, 'Context7 server missing');
  const raw = read('.mcp.json');
  for (const s of Object.values(servers)) {
    assert.ok(!('env' in s), 'env must not be declared');
    assert.ok(!('headers' in s), 'headers must not be declared');
  }
  assert.doesNotMatch(raw, /authorization|bearer|token|api[_-]?key|secret|lin_api_|ctx7sk/i);
});

test('S-DEV1004-02 Context7 is pinned', () => {
  const server = Object.values(mcp()).find((s) => (s.args ?? []).join(' ').includes('context7'));
  assert.ok(server, 'Context7 server missing');
  assert.ok(server.args.includes('@upstash/context7-mcp@4.4.4'));
  for (const arg of server.args) {
    assert.doesNotMatch(arg, /@(latest|next|beta)\b/);
    assert.doesNotMatch(arg, /context7-mcp@[\^~><*]/);
    assert.doesNotMatch(arg, /context7-mcp$/);
  }
});

test('S-DEV1004-03 Linear write tools require approval', () => {
  const { allow, ask } = JSON.parse(read('.claude', 'settings.json')).permissions;
  for (const tool of ['save_issue', 'save_project', 'save_comment']) {
    const name = `mcp__linear-server__${tool}`;
    assert.ok(ask.includes(name), `${name} must be in ask`);
    assert.ok(!allow.some((a) => a.includes(tool)), `${tool} must not be allowed`);
  }
});

test('S-DEV1004-04 failure modes documented', () => {
  const doc = read('docs', 'MCP.md').toLowerCase();
  assert.match(doc, /failure/);
  for (const mode of [
    /server unavailable/,
    /auth failure|expired oauth/,
    /missing ticket/,
    /malformed response/,
    /unsupported operation/,
    /rate limit/,
  ]) {
    assert.match(doc, mode);
  }
  assert.match(doc, /\|.*\|/, 'expected markdown tables');
});

test('S-DEV1004-05 evidence and operations present', () => {
  const text = read('docs', 'MCP.md');
  const doc = text.toLowerCase();
  assert.ok(text.trimEnd().split('\n').length <= 120, 'MCP.md must be <= 120 lines');
  for (const word of ['setup', 'operations', 'permissions']) assert.match(doc, new RegExp(word));
  assert.match(text, /DEV-5/);
  assert.match(text, /get_issue/);
  assert.match(text, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'timestamp missing');
  assert.match(text, /Could not find referenced Issue/);
  assert.match(text, /resolve-library-id/);
  assert.match(text, /query-docs/);
});

test('S-DEV1004-06 fixtures are labelled', () => {
  const dir = join(root, 'fixtures', 'linear');
  const files = readdirSync(dir).filter((f) => f.endsWith('.fixture.json'));
  assert.ok(files.length > 0, 'no fixtures found');
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    assert.equal(data.source, 'FIXTURE - NOT LIVE LINEAR DATA', f);
  }
});
