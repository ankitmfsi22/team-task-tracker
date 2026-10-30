#!/usr/bin/env node
// PreToolUse guard (Bash, Read|Edit|Write, Grep|Glob). Reads the hook JSON from stdin.
// Exit 2 + stderr reason blocks the call; exit 0 allows it.
// Contract: https://code.claude.com/docs/en/hooks
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENV_FILE = /(?:^|[\s/"'=<>])\.env(?:\.(?!example(?![\w.-]))[\w.-]+)?(?=$|[\s"';|&)])/;
const MAIN = '(?<![\\w/.-])(?:main|master)(?![\\w/.-])';

const BASH_RULES = [
  [ENV_FILE, 'reading .env files is forbidden (secrets); .env.example is fine'],
  [
    /\bgit\s+push\b[^\n;&|]*(?:\s--force\b|\s--force-with-lease\b|\s-[a-zA-Z]*f\b)/,
    'force push is forbidden',
  ],
  [new RegExp(`\\bgit\\s+push\\b[^\\n;&|]*${MAIN}`), 'never push to main'],
  [/\bgit\s+reset\s+[^\n;&|]*--hard\b/, 'git reset --hard is forbidden'],
  [/\bgit\s+clean\s+[^\n;&|]*-[a-zA-Z]*f/, 'git clean -f is forbidden'],
  [new RegExp(`\\bgit\\s+branch\\s+[^\\n;&|]*-D\\s+${MAIN}`), 'deleting main is forbidden'],
  [/\brm\s+(?:-[a-zA-Z-]+\s+)*(?:-[a-zA-Z]*[rR]|--recursive\b)/, 'recursive rm is forbidden'],
  [/@latest\b|@[\^~]\d/, 'use exact pinned versions, never @latest or a range'],
  [/--no-verify\b/, '--no-verify is forbidden'],
  [/--dangerously-skip-permissions\b/, '--dangerously-skip-permissions is forbidden'],
];

// Strip git global options (-C x, -c k=v, --git-dir, --work-tree, ...) so they cannot hide a subcommand.
const ARG = '(?:"[^"]*"|\'[^\']*\'|\\S+)';
const GIT_OPTS = new RegExp(
  `\\bgit(?:\\s+(?:-[Cc]\\s+${ARG}|--(?:git-dir|work-tree|namespace|exec-path)(?:=${ARG}|\\s+${ARG})|--[a-z-]+|-[pP]))+(?=\\s+[a-z])`,
  'g',
);
export const normalizeGit = (command) => command.replace(GIT_OPTS, 'git');

const unquote = (t) => t.replace(/^["']|["']$/g, '');

function checkPush(command) {
  for (const seg of command.matchAll(/\bgit\s+push\b([^\n;&|]*)/g)) {
    for (const raw of seg[1].split(/\s+/).filter(Boolean)) {
      const tok = unquote(raw);
      if (tok === '--mirror' || tok === '--all') return 'git push --mirror/--all is forbidden';
      if (tok.startsWith('-')) continue;
      if (tok.startsWith('+')) return 'force refspec (+) is forbidden';
      if (/^(?:refs\/heads\/)?(?:main|master)$/i.test(tok.split(':').pop())) {
        return 'never push to main';
      }
    }
  }
  return null;
}

export function checkBash(command) {
  const cmd = normalizeGit(command);
  for (const [re, reason] of BASH_RULES) if (re.test(cmd)) return reason;
  return checkPush(cmd);
}

// Glob/Grep: block secret-file names and wildcard prefixes (.*, .e*, .env*) that would match them.
export function checkGlob(pattern) {
  const name = basename(pattern);
  if (name.startsWith('.env.example')) return null;
  if (/^\.env/.test(name) || /^\.(?:e(?:n)?)?[*?[]/.test(name)) {
    return `${name} may match secret files; file tools cannot touch them`;
  }
  return null;
}

export function checkFile(filePath) {
  const name = basename(filePath);
  if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
    return `${name} may hold secrets; file tools cannot touch .env files`;
  }
  return null;
}

export function check(payload) {
  const input = payload?.tool_input ?? {};
  if (payload?.tool_name === 'Bash') return checkBash(String(input.command ?? ''));
  if (['Read', 'Edit', 'Write'].includes(payload?.tool_name) && input.file_path) {
    return checkFile(String(input.file_path));
  }
  if (payload?.tool_name === 'Grep') {
    return (
      (input.path && checkFile(String(input.path))) ||
      (input.glob && checkGlob(String(input.glob))) ||
      null
    );
  }
  if (payload?.tool_name === 'Glob') {
    return (
      (input.path && checkFile(String(input.path))) ||
      (input.pattern && checkGlob(String(input.pattern))) ||
      null
    );
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => (raw += chunk));
  process.stdin.on('end', () => {
    let payload = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }
    const reason = check(payload);
    if (reason) {
      process.stderr.write(`Blocked by guard hook: ${reason}\n`);
      process.exit(2);
    }
    process.exit(0);
  });
}
