import { readFileSync } from 'node:fs';
import { ErrorCodeSchema } from '@team-task-tracker/shared';
import { describe, expect, it } from 'vitest';
import { ERROR_STATUS } from './error-status.js';

const sds = readFileSync(new URL('../../../../docs/SDS.md', import.meta.url), 'utf8');
const section = sds.slice(sds.indexOf('### 4.2 Error codes'), sds.indexOf('### 4.3'));
const sdsStatuses: Record<string, number> = Object.fromEntries(
  [...section.matchAll(/^\| `([A-Z_]+)` \| (\d{3}) \|/gm)].map((match): [string, number] => [
    match[1] ?? '',
    Number(match[2]),
  ]),
);

describe('ERROR_STATUS', () => {
  it('matches the binding table in docs/SDS.md section 4.2', () => {
    expect(Object.keys(sdsStatuses)).toHaveLength(ErrorCodeSchema.options.length);
    expect(ERROR_STATUS).toEqual(sdsStatuses);
  });

  it('has a status for every shared ErrorCode', () => {
    expect(Object.keys(ERROR_STATUS).sort()).toEqual([...ErrorCodeSchema.options].sort());
  });

  it('uses only the documented statuses', () => {
    const allowed = new Set([400, 401, 403, 404, 409, 413, 422, 500]);
    expect(Object.values(ERROR_STATUS).every((status) => allowed.has(status))).toBe(true);
  });
});
