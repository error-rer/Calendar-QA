// Regression test: Customer vs Internal Audit classification for records shaped like the Worker's
// /api/state output (no stored type before migration 0020; site2/auditor2/department2 are copies). Run: npm test
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(process.cwd() + '/package.json');
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const server = await createServer({ root: process.cwd(), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { calculateAuditStats } = await server.ssrLoadModule('/src/utils/auditMetricsHelper.ts');
const { isInternalAssignment, getMissingFields, normalizeAssignment } = await server.ssrLoadModule('/src/types.ts');

// Exactly what assignmentOut() returns today: no type field; site2/auditor2/department2 are copies on every row.
const worker = (o) => normalizeAssignment({
  eng: 'e1', order: 'o1', auditor: 'A', site1: o.site, site2: o.site, auditor1: 'A', auditor2: 'A', qmsHost: 'A',
  standard: 'ISO9001', department1: 'ISO9001', department2: 'ISO9001', customer: '', endCustomer: '', targetPackage: '',
  customerNames: '', auditCategory: '', area: '', purpose: '', week: 21, day: 0, ...o,
});
const cs = (o) => worker({ customer: 'Northwind', endCustomer: 'NW Auto', targetPackage: 'QFN', customerNames: 'K. F', purpose: 'Annual', ...o });
const ia = (o) => worker({ auditCategory: 'Process', area: 'Die attach', ...o });

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${JSON.stringify(got)}${ok ? '' : ' want ' + JSON.stringify(want)}`);
};

check('worker CS is customer', isInternalAssignment(cs({ id: 'a1', site: 'UTL1' })), false);
check('worker IA is internal', isInternalAssignment(ia({ id: 'a2', site: 'UTL2A' })), true);
check('CS draft missing customer (has purpose) is customer', isInternalAssignment(worker({ id: 'a3', site: 'UTL2', purpose: 'Annual' })), false);
check('IA draft with only audit category is internal', isInternalAssignment(worker({ id: 'a4', site: 'UTL1', auditCategory: 'Process' })), true);
check('explicit type internal wins', isInternalAssignment(cs({ id: 'a5', site: 'UTL1', type: 'internal' })), true);
check('explicit type customer wins over area', isInternalAssignment(ia({ id: 'a6', site: 'UTL1', type: 'customer', customer: 'X' })), false);
check('complete worker CS has no missing IA fields', getMissingFields(cs({ id: 'a7', site: 'UTL1' })), []);

const records = [
  cs({ id: 'b1', site: 'UTL1', week: 21, day: 0 }),
  cs({ id: 'b2', site: 'UTL1', week: 21, day: 1 }),
  cs({ id: 'b3', site: 'UTL2', customer: 'Contoso', purpose: '', week: 21, day: 2 }),
  ia({ id: 'b4', site: 'UTL2A', standard: 'ISO14001', week: 21, day: 4 }),
];
const s = calculateAuditStats(records);
check('calculateAuditStats counts', { cs: s.customerAudits, ia: s.internalAudits, total: s.totalAudits }, { cs: 2, ia: 1, total: 3 });

await server.close();
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exit(failed ? 1 : 0);
