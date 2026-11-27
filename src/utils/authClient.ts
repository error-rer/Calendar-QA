export interface UserRecord {
  id: string;
  username: string;
  name?: string;
  role?: string;
  engineerId?: string;
  passwordHash?: string;
  salt?: string;
  createdAt?: string;
}

export interface AuthResult {
  ok: boolean;
  user: UserRecord;
}

const LOCAL_STORAGE_KEY = 'calendar_qa_users';
const SESSION_USER_KEY = 'calendar_qa_session_user';
const DEV_SESSION_KEY = 'calendar_qa_dev_session';
const DEV_REMEMBERED_USER_KEY = 'calendar_qa_remembered_user';

function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

function getDevSession(): UserRecord | null {
  if (!isDevelopment() || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEV_REMEMBERED_USER_KEY) || sessionStorage.getItem(DEV_SESSION_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return user && typeof user.id === 'string' && typeof user.username === 'string' ? user : null;
  } catch {
    return null;
  }
}

function setDevSession(user: UserRecord, rememberMe: boolean): void {
  if (!isDevelopment() || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEV_REMEMBERED_USER_KEY);
    sessionStorage.removeItem(DEV_SESSION_KEY);
    (rememberMe ? localStorage : sessionStorage).setItem(
      rememberMe ? DEV_REMEMBERED_USER_KEY : DEV_SESSION_KEY,
      JSON.stringify(user),
    );
  } catch {}
}

function clearDevSession(): void {
  if (!isDevelopment() || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEV_REMEMBERED_USER_KEY);
    sessionStorage.removeItem(DEV_SESSION_KEY);
  } catch {}
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json();
    return new Error(data.error || data.message || fallback);
  } catch {
    const text = await response.text().catch(() => '');
    return new Error(text || fallback);
  }
}

/**
 * Standard Web Crypto SHA-256 password hashing with salt
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':' + salt);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Local user accounts are available only for Vite development without a Worker. */
function getLocalUsers(): UserRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let changed = false;
        const users = parsed.filter((user) => !(
          (user?.id === 'usr_jordan' && user?.username === 'jordan.lee') ||
          (user?.id === 'usr_100234' && user?.username === '100234')
        ));
        if (users.length !== parsed.length) changed = true;
        if (users.length > 0 && !users.some((u) => (u?.role || 'user').toLowerCase() === 'admin')) {
          users[0] = { ...users[0], role: 'admin' };
          changed = true;
        }
        if (changed) saveLocalUsers(users);
        return users;
      }
    } catch {}
  }
  return [];
}

function saveLocalUsers(users: UserRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

/**
 * Validates User ID format
 * Must strictly accept numeric or alphanumeric User / Staff ID
 */
export function validateUserId(userId: string): { valid: boolean; error?: string } {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { valid: false, error: 'User ID is required.' };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return { valid: false, error: 'User ID may only contain numbers and letters (e.g. 100234 or UTAC12345).' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'User ID must be at least 3 characters long.' };
  }
  return { valid: true };
}

export const authClient = {
  persistSession(user: UserRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const safeUser = { id: user.id, username: user.username, name: user.name, role: user.role };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeUser));
      // Retain local-only sign-in fallback for development; production uses the HttpOnly server cookie.
      setDevSession(safeUser, true);
    } catch {}
  },
  getPersistedSession(): UserRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      const user = raw ? JSON.parse(raw) : null;
      return user && typeof user.id === 'string' && typeof user.username === 'string' ? user : null;
    } catch {
      return null;
    }
  },
  clearSession(): void {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(SESSION_USER_KEY); } catch {}
    }
    clearDevSession();
  },
  getDevelopmentSession: getDevSession,
  /**
   * Register a new account with User ID
   */
  async register(userId: string, password: string, name?: string, registrationCode = ''): Promise<AuthResult> {
    const check = validateUserId(userId);
    if (!check.valid) {
      throw new Error(check.error);
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const cleanUser = userId.trim();

    // 1. Attempt Cloudflare D1 backend API first
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, password, name, registrationCode }),
      });

      if (res.ok) {
        const data = await res.json();
        // Also cache locally for offline continuity
        const localUsers = getLocalUsers();
        if (!localUsers.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
          localUsers.push(data.user);
          saveLocalUsers(localUsers);
        }
        return { ok: true, user: data.user };
      }

      throw await responseError(res, 'Registration failed.');
    } catch (err: any) {
      if (!isDevelopment()) throw err;
      // If it's a known business validation error from backend, rethrow it
      if (err.message && (err.message.includes('already registered') || err.message.includes('User ID') || err.message.includes('registration code'))) {
        throw err;
      }
      // Otherwise, if network failed or 404 (local Vite dev mode without worker), fall back to localStorage
    }

    // 2. Local fallback (Offline / Vite dev without worker running)
    const localUsers = getLocalUsers();
    const exists = localUsers.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (exists) {
      throw new Error('User ID is already registered.');
    }

    const salt = Math.random().toString(36).slice(2, 10);
    const passwordHash = await hashPassword(password, salt);
    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      username: cleanUser,
      name: name?.trim() || cleanUser,
      role: localUsers.length === 0 ? 'admin' : 'user',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    return {
      ok: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
    };
  },

  /**
   * Sign In with User ID and Password
   */
  async login(userId: string, password: string, rememberMe = false): Promise<AuthResult> {
    const cleanUser = userId.trim();
    if (!cleanUser) {
      throw new Error('Please enter your User ID.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // 1. Attempt Cloudflare D1 backend API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, password, rememberMe }),
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, user: data.user };
      }

      throw await responseError(res, 'Authentication failed.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && (err.message.includes('not registered') || err.message.includes('Incorrect password') || err.message.includes('User ID')))) {
        throw err;
      }
      // If network/404 failed, fallback to local storage
    }

    // 2. Local fallback (Offline / Vite dev without worker running)
    const localUsers = getLocalUsers();
    const user = localUsers.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());

    if (!user) {
      throw new Error('User ID is not registered. Please sign up first.');
    }

    if (user.passwordHash && user.salt) {
      const testHash = await hashPassword(password, user.salt);
      if (testHash !== user.passwordHash) {
        throw new Error('Incorrect password. Please try again.');
      }
    }

    const result = {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role || 'user',
      },
    };
    setDevSession(result.user, rememberMe);
    return result;
  },

  async getSession(): Promise<AuthResult | null> {
    try {
      const res = await fetch('/api/auth/session', { headers: { 'Content-Type': 'application/json' } });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error('Unable to restore your sign-in session.');
      const data = await res.json();
      return { ok: true, user: data.user };
    } catch (err) {
      if (!isDevelopment()) throw err;
      const user = getDevSession();
      if (!user) return null;
      const localMatch = getLocalUsers().find((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
      const syncedUser = localMatch ? { ...user, role: localMatch.role || 'user', name: localMatch.name || user.name } : user;
      return { ok: true, user: syncedUser };
    }
  },

  async logout(): Promise<void> {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok && !isDevelopment()) throw new Error('Unable to end your server session.');
    } catch (err) {
      if (!isDevelopment()) throw err;
    }
    this.clearSession();
  },

  /**
   * Reset password for an existing User ID
   */
  async resetPassword(userId: string, currentPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
    const cleanUser = userId.trim();
    if (!cleanUser) {
      throw new Error('Please enter your User ID.');
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    if (!currentPassword) throw new Error('Current password is required.');

    // 1. Verify the current password at the Cloudflare D1 backend first.
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, currentPassword, newPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        // Also update local cache for offline continuity
        const localUsers = getLocalUsers();
        const user = localUsers.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());
        if (user) {
          const salt = user.salt || Math.random().toString(36).slice(2, 10);
          user.salt = salt;
          user.passwordHash = await hashPassword(newPassword, salt);
          saveLocalUsers(localUsers);
        }
        return { ok: true, message: data.message || 'Password updated successfully.' };
      }

      throw await responseError(res, 'Password change failed.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && (err.message.includes('not registered') || err.message.includes('User ID') || err.message.includes('Current password')))) {
        throw err;
      }
      // If network/404 failed, fallback to local storage
    }

    // 2. Local fallback (Offline / Vite dev without worker running)
    const localUsers = getLocalUsers();
    const user = localUsers.find((u) => u.username.toLowerCase() === cleanUser.toLowerCase());

    if (!user) {
      throw new Error('User ID is not registered.');
    }

    if (user.passwordHash && user.salt && await hashPassword(currentPassword, user.salt) !== user.passwordHash) {
      throw new Error('Current password is incorrect.');
    }

    const salt = user.salt || Math.random().toString(36).slice(2, 10);
    user.salt = salt;
    user.passwordHash = await hashPassword(newPassword, salt);
    saveLocalUsers(localUsers);

    return {
      ok: true,
      message: 'Password updated successfully.',
    };
  },

  /**
   * List all user accounts (Admin only)
   */
  async listUsers(): Promise<UserRecord[]> {
    try {
      const res = await fetch('/api/users', { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.users) ? data.users : [];
      }
      throw await responseError(res, 'Failed to load users.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && err.message.includes('Admin access required'))) {
        throw err;
      }
    }

    return getLocalUsers().map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name || u.username,
      role: (u.role || 'user').toLowerCase(),
      engineerId: u.engineerId || '',
      createdAt: u.createdAt,
    }));
  },

  /**
   * Create a new standard user account (Admin only; always created with role 'user')
   */
  async createUser(input: { userId: string; password: string; name?: string; engineerId?: string }): Promise<UserRecord> {
    const cleanUser = input.userId.trim();
    const check = validateUserId(cleanUser);
    if (!check.valid) throw new Error(check.error);
    if (!input.password || input.password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUser,
          username: cleanUser,
          password: input.password,
          name: input.name?.trim() || cleanUser,
          engineerId: input.engineerId || '',
          role: 'user',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      throw await responseError(res, 'Failed to create user.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && (err.message.includes('already registered') || err.message.includes('User ID') || err.message.includes('Password') || err.message.includes('Admin')))) {
        throw err;
      }
    }

    const localUsers = getLocalUsers();
    if (localUsers.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      throw new Error('User ID is already registered.');
    }

    const salt = Math.random().toString(36).slice(2, 10);
    const passwordHash = await hashPassword(input.password, salt);
    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      username: cleanUser,
      name: input.name?.trim() || cleanUser,
      role: 'user',
      engineerId: input.engineerId || '',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    return {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      engineerId: newUser.engineerId,
      createdAt: newUser.createdAt,
    };
  },

  /**
   * Grant admin role to an existing standard user (Admin only)
   */
  async grantAdmin(id: string): Promise<UserRecord> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      throw await responseError(res, 'Failed to grant admin role.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && (err.message.includes('not found') || err.message.includes('admin') || err.message.includes('Admin')))) {
        throw err;
      }
    }

    const localUsers = getLocalUsers();
    const idx = localUsers.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    if ((localUsers[idx].role || 'user').toLowerCase() === 'admin') {
      throw new Error('User is already an admin.');
    }

    localUsers[idx] = { ...localUsers[idx], role: 'admin' };
    saveLocalUsers(localUsers);

    return {
      id: localUsers[idx].id,
      username: localUsers[idx].username,
      name: localUsers[idx].name || localUsers[idx].username,
      role: 'admin',
      createdAt: localUsers[idx].createdAt,
    };
  },

  /**
   * Delete a standard user account (Admin only; cannot delete admin accounts)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) return;
      throw await responseError(res, 'Failed to delete user.');
    } catch (err: any) {
      if (!isDevelopment() || (err.message && (err.message.includes('not found') || err.message.includes('admin') || err.message.includes('Admin')))) {
        throw err;
      }
    }

    const localUsers = getLocalUsers();
    const target = localUsers.find((u) => u.id === id);
    if (!target) throw new Error('User not found.');
    if ((target.role || 'user').toLowerCase() === 'admin') {
      throw new Error('Admins cannot delete admin accounts.');
    }

    saveLocalUsers(localUsers.filter((u) => u.id !== id));
  },
};
