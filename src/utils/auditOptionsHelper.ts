import type { Assignment } from '../types';

/**
 * Fixed master plant sites list (Single Source of Truth for plant sites).
 * Exception: SITE field MUST continue using this fixed master list across all views,
 * even if there are currently 0 appointments scheduled for a site.
 */
export const MASTER_PLANT_SITES: readonly string[] = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
  'UTL3T',
];

export function getMasterSiteOptions(): string[] {
  return [...MASTER_PLANT_SITES];
}

/**
 * Normalizes a field key string to lowercase alphanumeric for flexible lookup.
 */
function normalizeFieldKey(fieldKey: string): string {
  return fieldKey.replace(/[\s_-]/g, '').toLowerCase();
}

/**
 * Helper to split and clean comma/slash-separated values or array entries.
 */
function extractCleanValues(val: unknown, targetSet: Set<string>): void {
  if (val === undefined || val === null) return;

  if (Array.isArray(val)) {
    for (const item of val) {
      extractCleanValues(item, targetSet);
    }
    return;
  }

  if (typeof val === 'string') {
    // Split on comma or slash (for multi-valued fields)
    const parts = val.split(/[,/]/);
    for (const part of parts) {
      const clean = part.trim();
      if (clean && clean.toLowerCase() !== 'unassigned' && clean.toLowerCase() !== 'all') {
        targetSet.add(clean);
      }
    }
  } else if (typeof val === 'number') {
    targetSet.add(String(val));
  }
}

/**
 * Derive unique dropdown/filter options strictly from active schedule records.
 *
 * Rules:
 * - Computes unique dropdown suggestions dynamically from current active appointments.
 * - Does NOT pull stale or orphaned values if no active appointment uses that value.
 * - When an appointment is deleted, any value only used in that appointment automatically disappears.
 * - Exception: SITE field returns the fixed master list of plant sites (UTL1, UTL2, UTL2A, UTL2B, UTL3, UTL3A, UTL3T).
 */
export const getActiveDropdownOptions = (
  activeAppointments: (Assignment | any)[] = [],
  fieldKey: keyof Assignment | string
): string[] => {
  const normKey = normalizeFieldKey(String(fieldKey));

  // Exception: SITE field MUST remain unchanged and continue using the predefined master list of plant sites
  if (
    normKey === 'site' ||
    normKey === 'site1' ||
    normKey === 'site2' ||
    normKey === 'plant' ||
    normKey === 'plantsite' ||
    normKey === 'plantsites' ||
    normKey === 'sites'
  ) {
    return getMasterSiteOptions();
  }

  const uniqueValues = new Set<string>();

  // Filter out any undefined/null or soft-deleted records
  const validAppts = (activeAppointments || []).filter(
    (apt) => apt && !apt._deleted && !apt.isDeleted
  );

  for (const apt of validAppts) {
    if (normKey === 'standard' || normKey === 'standards') {
      extractCleanValues(apt.standard, uniqueValues);
      extractCleanValues(apt.department1, uniqueValues);
      extractCleanValues(apt.department2, uniqueValues);
      extractCleanValues(apt.department, uniqueValues);
    } else if (normKey === 'customer' || normKey === 'customers') {
      extractCleanValues(apt.customer, uniqueValues);
    } else if (normKey === 'endcustomer' || normKey === 'endcustomers') {
      extractCleanValues(apt.endCustomer, uniqueValues);
    } else if (normKey === 'purpose' || normKey === 'purposes' || normKey === 'apptpurpose') {
      extractCleanValues(apt.purpose, uniqueValues);
      extractCleanValues(apt.apptPurpose, uniqueValues);
    } else if (normKey === 'targetpackage' || normKey === 'targetpackages') {
      extractCleanValues(apt.targetPackage, uniqueValues);
    } else if (normKey === 'customername' || normKey === 'customernames') {
      extractCleanValues(apt.customerNames, uniqueValues);
      extractCleanValues(apt.customerName, uniqueValues);
    } else if (normKey === 'qmshost' || normKey === 'qmshosts' || normKey === 'auditor' || normKey === 'auditors') {
      extractCleanValues(apt.qmsHost, uniqueValues);
      extractCleanValues(apt.auditor, uniqueValues);
      extractCleanValues(apt.auditor1, uniqueValues);
      extractCleanValues(apt.auditor2, uniqueValues);
      extractCleanValues(apt.leadAuditor, uniqueValues);
    } else if (normKey === 'auditcategory' || normKey === 'auditcategories') {
      extractCleanValues(apt.auditCategory, uniqueValues);
    } else if (normKey === 'area' || normKey === 'departmentarea') {
      extractCleanValues(apt.area, uniqueValues);
    } else if (normKey === 'department1') {
      extractCleanValues(apt.department1, uniqueValues);
      if (apt.standard && apt.sectionType !== 'internal') {
        extractCleanValues(apt.standard, uniqueValues);
      }
    } else if (normKey === 'department2') {
      extractCleanValues(apt.department2, uniqueValues);
      if (apt.standard && apt.sectionType === 'internal') {
        extractCleanValues(apt.standard, uniqueValues);
      }
    } else {
      const rawVal = apt[fieldKey as keyof Assignment] ?? apt[normKey];
      extractCleanValues(rawVal, uniqueValues);
    }
  }

  return Array.from(uniqueValues).sort((a, b) => a.localeCompare(b));
};
