// Regression test: when an audit counts as having a result (green vs amber). Run: npm test
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(process.cwd() + '/package.json');
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { isAuditResultCompleted, normalizeAuditResults, resolveAuditStatus } = await server.ssrLoadModule('/src/types.ts');

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${JSON.stringify(got)}${ok ? '' : ' want ' + JSON.stringify(want)}`);
};
const zero = { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0 };

check('nothing entered', isAuditResultCompleted({ results: {} }), false);
check('zeros without Save (Clear Results)', isAuditResultCompleted({ results: { UTL1: zero } }), false);
check('zero findings saved', isAuditResultCompleted({ results: { UTL1: { ...zero, recorded: true } } }), true);
check('older record with a finding', isAuditResultCompleted({ results: { UTL1: { ...zero, minor: 2 } } }), true);
check('numeric findings total of 0 does not hide saved results',
  isAuditResultCompleted({ findings: 0, major: 0, results: { UTL1: { ...zero, recorded: true } } }), true);
check('legacy top-level count', isAuditResultCompleted({ major: 1 }), true);
check('normalize keeps the saved flag', normalizeAuditResults({ U1: { ...zero, recorded: true } }), { UTL1: { ...zero, recorded: true } });
check('normalize merge keeps the saved flag', normalizeAuditResults({ U1: { ...zero }, UTL1: { ...zero, recorded: true } }).UTL1.recorded, true);

// A past audit created and saved more than 7 days ago: amber without a result, green with zero findings saved.
const longAgo = new Date(Date.now() - 30 * 86400000).toISOString();
const past = {
  id: 'r1', eng: 'e1', order: 'o1', week: 0, day: 0, sectionType: 'customer', type: 'customer',
  customer: 'Northwind', endCustomer: 'NW', targetPackage: 'QFN', customerNames: 'K', purpose: 'Annual',
  site: 'UTL1', site1: 'UTL1', auditor: 'A', auditor1: 'A', qmsHost: 'A', standard: 'ISO9001', department1: 'ISO9001',
  createdAt: longAgo, updatedAt: longAgo,
};
check('past audit without result is Pending Result', resolveAuditStatus({ ...past, results: { UTL1: zero } }), 'PENDING_RESULT');
check('past audit with zero findings saved is Complete', resolveAuditStatus({ ...past, results: { UTL1: { ...zero, recorded: true } } }), 'COMPLETE_DATA');

await server.close();
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exit(failed ? 1 : 0);
