import type { Activity, ActivityLog, Assignment, Comment, Engineer, Order, Plant } from './types';
import { authClient, type AuthResult, type UserRecord } from './utils/authClient';

const BASE = '/api';

export interface ApiState {
  engineers: Engineer[];
  plants: Plant[];
  activePlants: Record<string, boolean>;
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
  activityLogs?: ActivityLog[];
  historyHasMore?: boolean;
  purposeOptions?: string[];
  customerDepartmentOptions?: string[];
  internalDepartmentOptions?: string[];
  departmentOptions?: string[];
  siteCodeOptions?: string[];
  siteColors?: Record<string, string>;
  customerOptions?: string[];
  endCustomerOptions?: string[];
  auditorOptions?: string[];
  targetPackageOptions?: string[];
  customerNameOptions?: string[];
  auditCategoryOptions?: string[];
  customHolidays?: CustomHolidayRecord[];
}

export type CustomHolidayType = 'PUBLIC_HOLIDAY' | 'SHUTDOWN_PLANT' | 'NO_CUSTOMER_AUDITS' | 'WORKING_DAY';

export interface CustomHolidayRecord {
  date: string; // 'YYYY-MM-DD'
  type: CustomHolidayType;
  note?: string;
  lockedSites?: string[];
  created_at?: string;
  updated_at?: string;
}

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  fetchState: () => req<ApiState>('/state'),

  // Shared History. The server records who made the change and when.
  addHistory: (entry: Pick<ActivityLog, 'actionType' | 'entityType' | 'description' | 'metadata'>) =>
    req<ActivityLog>('/history', { method: 'POST', body: JSON.stringify(entry) }),
  fetchHistory: (before: { timestamp: string; id: string }) =>
    req<{ entries: ActivityLog[]; hasMore: boolean }>(
      '/history?before=' + encodeURIComponent(before.timestamp) + '&beforeId=' + encodeURIComponent(before.id)
    ),

  createEngineer: (data: { id: string; name: string; role: string; site?: string; department?: string; subDepartments: string[] }) =>
    req('/engineers', { method: 'POST', body: JSON.stringify(data) }),
  updateEngineer: (id: string, data: { name: string; role: string; site?: string; department?: string; subDepartments: string[] }) =>
    req('/engineers/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEngineer: (id: string) => req('/engineers/' + id, { method: 'DELETE' }),

  togglePlant: (id: string) => req('/plants/' + id + '/toggle', { method: 'POST' }),

  createOrder: (data: { id: string; code: string; customer: string; product: string; plant: string; purpose: string }) =>
    req('/orders', { method: 'POST', body: JSON.stringify(data) }),
  deleteOrder: (id: string) => req('/orders/' + id, { method: 'DELETE' }),

  createAssignment: (data: Partial<Assignment> & { id: string; eng: string; order: string }) =>
    req('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: string, data: Partial<Assignment>) =>
    req('/assignments/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id: string) => req('/assignments/' + id, { method: 'DELETE' }),

  createComment: (assignmentId: string, data: Comment) =>
    req('/comments', { method: 'POST', body: JSON.stringify({ ...data, assignmentId }) }),
  deleteComment: (id: string) => req('/comments/' + id, { method: 'DELETE' }),

  logActivity: (data: { id: string; who: string; text: string; ago: string; color: string }) =>
    req('/activity', { method: 'POST', body: JSON.stringify(data) }),

  saveOption: (category: string, value: string, meta?: string) =>
    req('/options', { method: 'POST', body: JSON.stringify({ category, value, meta }) }),
  deleteOption: (category: string, value: string) =>
    req('/options', { method: 'DELETE', body: JSON.stringify({ category, value }) }),
  saveOptionOrder: (category: string, values: string[]) =>
    req('/options/reorder', { method: 'PUT', body: JSON.stringify({ category, values }) }),

  getHolidays: () => req<CustomHolidayRecord[]>('/holidays'),
  saveHoliday: (data: {
    date?: string;
    type?: CustomHolidayType;
    note?: string;
    lockedSites?: string[];
    items?: Array<{ date: string; type: CustomHolidayType; note?: string; lockedSites?: string[] }>;
    actor?: string;
    description?: string;
    actionType?: string;
  }) =>
    req<{ ok: boolean; activity?: Activity }>('/holidays', { method: 'POST', body: JSON.stringify(data) }),
  deleteHoliday: (date: string, meta?: { actor?: string; description?: string; actionType?: string }) =>
    req<{ ok: boolean; activity?: Activity }>('/holidays/' + encodeURIComponent(date), {
      method: 'DELETE',
      body: meta ? JSON.stringify(meta) : undefined,
    }),
  deleteHolidays: (dates: string[], meta?: { actor?: string; description?: string; actionType?: string }) =>
    req<{ ok: boolean; activity?: Activity }>('/holidays', {
      method: 'DELETE',
      body: JSON.stringify({ dates, ...meta }),
    }),
  resetHolidays: (year: number, meta?: { actor?: string; description?: string }) =>
    req<{ ok: boolean; activity?: Activity }>('/holidays/reset', {
      method: 'POST',
      body: JSON.stringify({ year, ...meta }),
    }),

  register: (userId: string, password: string, name?: string, registrationCode?: string): Promise<AuthResult> =>
    authClient.register(userId, password, name, registrationCode),
  login: (userId: string, password: string, rememberMe?: boolean): Promise<AuthResult> =>
    authClient.login(userId, password, rememberMe),
  resetPassword: (userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> =>
    authClient.resetPassword(userId, currentPassword, newPassword),
};

export type { UserRecord, AuthResult };
