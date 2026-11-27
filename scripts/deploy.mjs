#!/usr/bin/env node
// Release: build, apply pending D1 migrations, then deploy the Worker (`npm run deploy`).
//
// Why a script instead of chaining wrangler commands: `wrangler d1 migrations apply` exits
// successfully when the operator answers "No" at its prompt, so a plain `&& wrangler deploy`
// would ship code without its migrations. Here, declining cancels the whole release, and a
// failed migration stops it before any code is deployed.
//
//   npm run deploy                     production (asks before applying migrations)
//   npm run deploy -- --yes            no prompt (CI); also used automatically without a terminal
//   npm run deploy -- --local          rehearsal: migrate the local D1 and skip `wrangler deploy`
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const DB = 'calendar-qa-db';
const args = new Set(process.argv.slice(2));
const local = args.has('--local');
const target = local ? '--local' : '--remote';
const interactive = process.stdin.isTTY && process.stdout.isTTY && !args.has('--yes');

const run = (cmd, cmdArgs, { capture = false } = {}) => {
  const res = spawnSync(cmd, cmdArgs, {
    // stdin is never a terminal for wrangler, so it does not prompt a second time.
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    encoding: 'utf8',
    env: { ...process.env, CI: process.env.CI || '1' },
    shell: process.platform === 'win32',
  });
  return { ok: res.status === 0, out: `${res.stdout || ''}${res.stderr || ''}` };
};
const fail = (msg) => { console.error(`\n✖ ${msg}`); process.exit(1); };

console.log(`▸ Building`);
if (!run('npm', ['run', 'build']).ok) fail('Build failed. Nothing was deployed.');

console.log(`▸ Checking ${local ? 'local' : 'production'} D1 for pending migrations`);
const listed = run('npx', ['wrangler', 'd1', 'migrations', 'list', DB, target], { capture: true });
if (!listed.ok) fail(`Could not read migration status:\n${listed.out.trim()}`);
const pending = [...new Set(listed.out.match(/\b\d{4}_[\w-]+\.sql\b/g) || [])];

if (pending.length) {
  console.log(`\n  ${pending.length} pending migration(s):\n${pending.map((m) => `    • ${m}`).join('\n')}\n`);
  if (interactive) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    let answer = '';
    try {
      answer = (await rl.question(`  Apply ${pending.length === 1 ? 'it' : 'them'} and deploy? [y/N] `)).trim().toLowerCase();
    } catch {
      answer = ''; // Ctrl+D / Ctrl+C at the prompt counts as "no"
    } finally {
      rl.close();
    }
    if (answer !== 'y' && answer !== 'yes') fail('Cancelled. No migrations were applied and nothing was deployed.');
  }
  if (!local) {
    // D1 Time Travel can restore the database to this point if the release has to be undone.
    const tt = run('npx', ['wrangler', 'd1', 'time-travel', 'info', DB], { capture: true });
    console.log(tt.ok
      ? `\n  Restore point before migrating (keep this in the change record):\n${tt.out.trim().replace(/^/gm, '    ')}\n`
      : `\n  ⚠ Could not read a Time Travel restore point; record one manually before continuing.\n${tt.out.trim()}\n`);
  }
  console.log(`▸ Applying migrations`);
  if (!run('npx', ['wrangler', 'd1', 'migrations', 'apply', DB, target]).ok) {
    fail('A migration failed. Wrangler rolled back that migration; earlier ones stay applied. The Worker was NOT deployed.');
  }
} else {
  console.log('  No pending migrations.');
}

if (local) {
  console.log('\n✔ Local rehearsal finished (wrangler deploy skipped).');
  process.exit(0);
}
console.log(`▸ Deploying the Worker`);
if (!run('npx', ['wrangler', 'deploy']).ok) fail('wrangler deploy failed. Migrations above were already applied; the previous Worker version is still live.');
console.log('\n✔ Released.');
