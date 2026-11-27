import { useEffect, useRef, useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';
import { authClient, validateUserId, type UserRecord } from '../utils/authClient';

interface UsersPanelProps {
  vm: VM;
  users: UserRecord[];
  loading: boolean;
  initialError?: string | null;
  onUsersChange: (updater: UserRecord[] | ((prev: UserRecord[]) => UserRecord[])) => void;
  preselectedHost?: { id: string; name: string } | null;
  onClearPreselectedHost?: () => void;
}

export function UsersPanel({
  vm,
  users,
  loading,
  initialError,
  onUsersChange,
  preselectedHost,
  onClearPreselectedHost,
}: UsersPanelProps) {
  const [error, setError] = useState<string | null>(initialError || null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newUserId, setNewUserId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedHostId, setSelectedHostId] = useState('');
  const [creating, setCreating] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmGrantId, setConfirmGrantId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const userIdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (preselectedHost) {
      setSelectedHostId(preselectedHost.id);
      setNewName(preselectedHost.name);
      setError(null);
      setFeedback(null);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => userIdInputRef.current?.focus(), 180);
    }
  }, [preselectedHost]);

  if (!vm.canManage) return null;

  const hosts = vm.engineers || [];
  const totalUsers = users.length;

  const resolveLinkedHost = (u: UserRecord) => {
    if (u.engineerId) {
      const byId = hosts.find((h) => h.id === u.engineerId);
      if (byId) return byId;
    }
    const uname = (u.name || '').trim().toLowerCase();
    const uid = (u.username || '').trim().toLowerCase();
    return hosts.find((h) => {
      const hn = h.name.trim().toLowerCase();
      return hn && (hn === uname || hn === uid);
    });
  };

  const handleHostSelect = (hostId: string) => {
    setSelectedHostId(hostId);
    if (!hostId) {
      onClearPreselectedHost?.();
      return;
    }
    const host = hosts.find((h) => h.id === hostId);
    if (host && !newName.trim()) {
      setNewName(host.name);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const idCheck = validateUserId(newUserId);
    if (!idCheck.valid) {
      setError(idCheck.error || 'Invalid User ID.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setCreating(true);
    try {
      const created = await authClient.createUser({
        userId: newUserId.trim(),
        name: newName.trim() || undefined,
        password: newPassword,
        engineerId: selectedHostId || undefined,
      });
      onUsersChange((prev) => [...prev, created]);
      setNewUserId('');
      setNewName('');
      setNewPassword('');
      setSelectedHostId('');
      onClearPreselectedHost?.();
      setFeedback(`Created user "${created.username}" with standard user access.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleGrantAdmin = async (user: UserRecord) => {
    setError(null);
    setFeedback(null);
    setBusyId(user.id);
    try {
      const updated = await authClient.grantAdmin(user.id);
      onUsersChange((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)));
      setConfirmGrantId(null);
      setFeedback(`Granted admin role to "${user.username}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to grant admin role.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    setError(null);
    setFeedback(null);
    setBusyId(user.id);
    try {
      await authClient.deleteUser(user.id);
      onUsersChange((prev) => prev.filter((u) => u.id !== user.id));
      setConfirmDeleteId(null);
      setFeedback(`Deleted user "${user.username}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {error && (
        <div role="alert" style={css('margin-bottom:14px;padding:10px 14px;background:#fff1f0;border:1px solid #f2b8b5;border-radius:10px;color:#8f211b;font-size:12.5px;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} style={css('border:0;background:transparent;color:inherit;font-weight:700;cursor:pointer')}>Dismiss</button>
        </div>
      )}

      {feedback && (
        <div role="status" style={css('margin-bottom:14px;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#166534;font-size:12.5px;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} style={css('border:0;background:transparent;color:inherit;font-weight:700;cursor:pointer')}>Dismiss</button>
        </div>
      )}

      {/* Create New User Card */}
      <form ref={formRef} onSubmit={handleCreateUser} style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:18px 20px;margin-bottom:18px')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap')}>
          <div>
            <div style={css('font-size:14.5px;font-weight:700;color:#15191e')}>Create new user</div>
            <div style={css('font-size:12px;color:#7a807a;margin-top:2px')}>
              New accounts are created with the standard <strong>user</strong> role. Admins cannot create or delete other admins directly.
            </div>
          </div>
          {preselectedHost && (
            <button
              type="button"
              onClick={() => {
                setSelectedHostId('');
                setNewName('');
                onClearPreselectedHost?.();
              }}
              style={css('border:1px solid #dde0d9;background:#f4f6f1;color:#4a504a;font-size:11px;font-weight:600;padding:4px 9px;border-radius:6px;cursor:pointer')}
            >
              Creating for: {preselectedHost.name} ✕
            </button>
          )}
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;align-items:end')}>
          <div>
            <label style={css("display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#8a9088;letter-spacing:.4px;margin-bottom:5px")}>LINK QMS HOST</label>
            <select
              value={selectedHostId}
              onChange={(e) => handleHostSelect(e.target.value)}
              style={css("width:100%;padding:8px 10px;border:1px solid #dde0d9;border-radius:8px;font-size:13px;font-family:'Archivo',sans-serif;color:#15191e;background:#fff")}
            >
              <option value="">Optional — none</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={css("display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#8a9088;letter-spacing:.4px;margin-bottom:5px")}>USER ID *</label>
            <input
              ref={userIdInputRef}
              type="text"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="e.g. 100512"
              style={css("width:100%;padding:8px 10px;border:1px solid #dde0d9;border-radius:8px;font-size:13px;font-family:'Archivo',sans-serif;color:#15191e;background:#fff")}
            />
          </div>
          <div>
            <label style={css("display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#8a9088;letter-spacing:.4px;margin-bottom:5px")}>DISPLAY NAME</label>
            <HInput
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Optional display name"
              style={css("width:100%;padding:8px 10px;border:1px solid #dde0d9;border-radius:8px;font-size:13px;font-family:'Archivo',sans-serif;color:#15191e;background:#fff")}
            />
          </div>
          <div>
            <label style={css("display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#8a9088;letter-spacing:.4px;margin-bottom:5px")}>PASSWORD *</label>
            <HInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 4 characters"
              style={css("width:100%;padding:8px 10px;border:1px solid #dde0d9;border-radius:8px;font-size:13px;font-family:'Archivo',sans-serif;color:#15191e;background:#fff")}
            />
          </div>
          <div>
            <HButton
              type="submit"
              disabled={creating}
              className="tap"
              style={css("width:100%;padding:9px 14px;border-radius:8px;border:0;background:#15191e;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
              hover={{ background: '#2a3038' }}
            >
              {creating ? 'Creating…' : '+ Create user'}
            </HButton>
          </div>
        </div>
      </form>

      {/* Users Table */}
      <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;overflow:hidden')}>
        <div style={css('padding:14px 18px;border-bottom:1px solid #e7eae3;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
          <div style={css('font-size:14px;font-weight:700;color:#15191e')}>Users &amp; Roles</div>
          <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088")}>
            {loading ? 'Loading…' : `${totalUsers} account${totalUsers === 1 ? '' : 's'}`}
          </span>
        </div>

        {!loading && users.length === 0 && (
          <div style={css('padding:24px;text-align:center;color:#7a807a;font-size:13px')}>
            No user accounts found.
          </div>
        )}

        {users.map((u, idx) => {
          const isTargetAdmin = (u.role || 'user').toLowerCase() === 'admin';
          const isSelf = u.id === vm.currentUser?.id || u.username === vm.currentUser?.username;
          const displayName = u.name || u.username;
          const initials = (displayName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || '?').toUpperCase();
          const isBusy = busyId === u.id;
          const linkedHost = resolveLinkedHost(u);

          return (
            <div
              key={u.id}
              style={css(
                'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;flex-wrap:wrap;' +
                (idx < users.length - 1 ? 'border-bottom:1px solid #eef1ea;' : '')
              )}
            >
              <div style={css('display:flex;align-items:center;gap:11px;min-width:0')}>
                <div style={css("width:34px;height:34px;border-radius:9px;background:" + (isTargetAdmin ? '#15191e' : '#e9ebe6') + ';color:' + (isTargetAdmin ? '#fff' : '#3c423d') + ";display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:700;flex-shrink:0")}>
                  {initials}
                </div>
                <div style={css('min-width:0')}>
                  <div style={css('display:flex;align-items:center;gap:7px;flex-wrap:wrap')}>
                    <span style={css('font-size:13px;font-weight:600;color:#15191e')}>{displayName}</span>
                    {isSelf && (
                      <span style={css("font-size:10px;font-weight:600;color:#6a706a;background:#f4f6f1;border:1px solid #dde0d9;padding:1px 6px;border-radius:5px")}>You</span>
                    )}
                    <span style={css(
                      'font-size:10.5px;font-weight:700;padding:1.5px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.3px;' +
                      (isTargetAdmin
                        ? 'background:#eef2fd;color:#2756d6;border:1px solid #c7d5fa;'
                        : 'background:#f4f6f1;color:#5c625c;border:1px solid #dde0d9;')
                    )}>
                      {isTargetAdmin ? 'Admin' : 'User'}
                    </span>
                    {linkedHost && (
                      <span style={css("font-size:10.5px;font-weight:600;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;padding:1.5px 8px;border-radius:6px")}>
                        QMS Host: {linkedHost.name}
                      </span>
                    )}
                  </div>
                  <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088;margin-top:2px")}>
                    ID: {u.username}
                  </div>
                </div>
              </div>

              <div style={css('display:flex;align-items:center;gap:7px;flex-wrap:wrap')}>
                {isTargetAdmin ? (
                  <span style={css('font-size:11.5px;color:#8a9088;font-style:italic;padding:4px 8px')}>
                    Protected admin
                  </span>
                ) : (
                  <>
                    {confirmGrantId === u.id ? (
                      <div style={css('display:flex;align-items:center;gap:5px')}>
                        <HButton
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleGrantAdmin(u)}
                          className="tap"
                          style={css("padding:6px 10px;border-radius:7px;border:0;background:#2756d6;color:#fff;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        >
                          {isBusy ? 'Saving…' : 'Confirm Admin'}
                        </HButton>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmGrantId(null)}
                          style={css("padding:6px 9px;border-radius:7px;border:1px solid #dde0d9;background:#fff;color:#4a504a;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <HButton
                        type="button"
                        disabled={isBusy}
                        onClick={() => { setConfirmDeleteId(null); setConfirmGrantId(u.id); }}
                        className="tap"
                        style={css("padding:6px 11px;border-radius:7px;border:1px solid #c7d5fa;background:#eef2fd;color:#2756d6;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        hover={{ background: '#dfe8fc' }}
                      >
                        Grant Admin
                      </HButton>
                    )}

                    {confirmDeleteId === u.id ? (
                      <div style={css('display:flex;align-items:center;gap:5px')}>
                        <HButton
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteUser(u)}
                          className="tap"
                          style={css("padding:6px 10px;border-radius:7px;border:0;background:#dc2626;color:#fff;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        >
                          {isBusy ? 'Deleting…' : 'Confirm Delete'}
                        </HButton>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmDeleteId(null)}
                          style={css("padding:6px 9px;border-radius:7px;border:1px solid #dde0d9;background:#fff;color:#4a504a;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <HButton
                        type="button"
                        disabled={isBusy}
                        onClick={() => { setConfirmGrantId(null); setConfirmDeleteId(u.id); }}
                        className="tap"
                        style={css("padding:6px 11px;border-radius:7px;border:1px solid #fecaca;background:#fff5f5;color:#b91c1c;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                        hover={{ background: '#fee2e2' }}
                      >
                        Delete
                      </HButton>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
