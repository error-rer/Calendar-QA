import type { Activity, Assignment, Comment, Engineer, Order, Plant } from './types';

const BASE = '/api';

export interface ApiState {
  engineers: Engineer[];
  plants: Plant[];
  activePlants: Record<string, boolean>;
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
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

  createEngineer: (data: { id: string; name: string; role: string; department: string; subDepartments: string[] }) =>
    req('/engineers', { method: 'POST', body: JSON.stringify(data) }),
  deleteEngineer: (id: string) => req('/engineers/' + id, { method: 'DELETE' }),

  togglePlant: (id: string) => req('/plants/' + id + '/toggle', { method: 'POST' }),

  createOrder: (data: { id: string; code: string; customer: string; product: string; plant: string; purpose: string }) =>
    req('/orders', { method: 'POST', body: JSON.stringify(data) }),

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
};
