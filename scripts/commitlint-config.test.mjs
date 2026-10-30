import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const lint = (message) =>
  spawnSync('pnpm', ['exec', 'commitlint'], { input: message, encoding: 'utf8' });

const accepted = (message) => assert.equal(lint(message).status, 0, `should accept: ${message}`);
const rejected = (message) => assert.notEqual(lint(message).status, 0, `should reject: ${message}`);

test('commitlint accepts a conventional message with a scope and a DEV ticket reference', () => {
  accepted('feat(auth): add login DEV-1002');
  accepted('docs(frs): add functional requirements DEV-1001');
  accepted(
    'fix(tasks): reject empty title DEV-1004\n\nBody text.\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
  );
});

test('commitlint rejects a message without a scope', () => {
  rejected('feat: add login DEV-1002');
});

test('commitlint rejects a message without a DEV ticket reference', () => {
  rejected('feat(auth): add login');
  rejected('feat(auth): add login #1002');
});

test('commitlint rejects a header that is not in conventional format', () => {
  rejected('added some stuff DEV-1002');
  rejected('Feat(auth): Add login. DEV-1002');
});
