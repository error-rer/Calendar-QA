export interface UserRecord {
  id: string;
  username: string;
  name?: string;
  role?: string;
  passwordHash?: string;
  salt?: string;
  createdAt?: string;
}

export interface AuthResult {
  ok: boolean;
  user: UserRecord;
}

const LOCAL_STORAGE_KEY = 'calendar_qa_users';

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

/**
 * Retrieves local users from localStorage with default demo seed users
 */
function getLocalUsers(): UserRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // Pre-seed Jordan Lee demo accounts
  // Password is 'directorqa', hash with salt 'seed_salt'
  const seedUsers: UserRecord[] = [
    {
      id: 'usr_jordan',
      username: 'jordan.lee',
      name: 'Jordan Lee',
      role: 'admin',
      salt: 'seed_salt',
      passwordHash: '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_100234',
      username: '100234',
      name: 'Jordan Lee',
      role: 'admin',
      salt: 'seed_salt',
      passwordHash: '2d058547072ff2557887cbe75c1633a2cc7fe0c9afc2a243817ea7a4d55f91fe',
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedUsers));
  } catch {}

  return seedUsers;
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
  /**
   * Register a new account with User ID
   */
  async register(userId: string, password: string, name?: string): Promise<AuthResult> {
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
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, password, name }),
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

      // If backend returned a specific HTTP error (e.g. 409 already exists)
      if (res.status === 409 || res.status === 400) {
        let errMsg = 'Registration failed.';
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      // If it's a known business validation error from backend, rethrow it
      if (err.message && (err.message.includes('already registered') || err.message.includes('User ID'))) {
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
      role: 'user',
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
  async login(userId: string, password: string): Promise<AuthResult> {
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
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, password }),
      });

      if (res.ok) {
        const data = await res.json();
        return { ok: true, user: data.user };
      }

      if (res.status === 401 || res.status === 400 || res.status === 404) {
        let errMsg = 'Authentication failed.';
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('not registered') || err.message.includes('Incorrect password') || err.message.includes('User ID'))) {
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

    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role || 'user',
      },
    };
  },

  /**
   * Reset password for an existing User ID
   */
  async resetPassword(userId: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
    const cleanUser = userId.trim();
    if (!cleanUser) {
      throw new Error('Please enter your User ID.');
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    // 1. Attempt Cloudflare D1 backend API first
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUser, username: cleanUser, newPassword, password: newPassword }),
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

      if (res.status === 404 || res.status === 400) {
        let errMsg = 'Password reset failed.';
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('not registered') || err.message.includes('User ID'))) {
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

    const salt = user.salt || Math.random().toString(36).slice(2, 10);
    user.salt = salt;
    user.passwordHash = await hashPassword(newPassword, salt);
    saveLocalUsers(localUsers);

    return {
      ok: true,
      message: 'Password updated successfully.',
    };
  },
};
