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

  createPlant: (data: { id: string; name: string; loc: string; code: string; color: string }) =>
    req('/plants', { method: 'POST', body: JSON.stringify(data) }),
  togglePlant: (id: string) => req('/plants/' + id + '/toggle', { method: 'POST' }),
  deletePlant: (id: string) => req('/plants/' + id, { method: 'DELETE' }),

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
};
