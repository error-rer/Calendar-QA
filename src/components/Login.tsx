import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';
import { authClient, validateUserId } from '../utils/authClient';

export function Login({ vm }: { vm: VM }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userId, setUserId] = useState(vm.loginEmail || '');
  const [password, setPassword] = useState(vm.loginPass || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchToSignUp = () => {
    setIsSignUp(true);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchToSignIn = () => {
    setIsSignUp(false);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = userId.trim();
    if (!cleanId) {
      setError('Please enter your User ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authClient.login(cleanId, password);
      if (res.ok && res.user) {
        vm.onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = userId.trim();
    const idCheck = validateUserId(cleanId);
    if (!idCheck.valid) {
      setError(idCheck.error || 'Please enter a valid User ID.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authClient.register(cleanId, password);
      if (res.ok) {
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setSuccess(`Account registered for ${cleanId}! Please sign in with your password.`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={vm.loginWrapStyle}>
      <div style={vm.loginBrandStyle}>
        <div style={css('display:flex;align-items:center;gap:11px;position:relative;z-index:2')}>
          <img
            src="/utac-logo.jpg"
            alt="UTAC Logo"
            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'contain', background: '#fff', padding: '2px' }}
          />
          <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>UTAC</div>
        </div>

        {vm.isMobile && (
          <div style={css('font-size:13px;color:#9aa0a0;margin-top:8px;position:relative;z-index:2')}>
            Plan QA site coverage - together, on any device.
          </div>
        )}

        {vm.showLoginExtras && (
          <>
            <div style={css('flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2;max-width:380px')}>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6fe3a0;letter-spacing:1.5px;margin-bottom:16px")}>QA OPERATIONS PLATFORM</div>
              <div style={css('font-size:34px;font-weight:700;line-height:1.1;letter-spacing:-.8px;margin-bottom:16px')}>
                Plan site coverage<br />without the spreadsheet.
              </div>
              <div style={css('font-size:14px;line-height:1.55;color:#9aa0a0')}>
                Schedule which QA go to which internal site, on which customer lot - together, in real time, with standard and conflict guardrails.
              </div>
              <div style={css('display:flex;flex-direction:column;gap:11px;margin-top:28px')}>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Cross-site weekly coverage grid</div>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Live standard &amp; double-book checks</div>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Shared planning with your QA leads</div>
              </div>
            </div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#5a6160;position:relative;z-index:2")}>v2.4 - UTL1 - UTL2 - UTL3</div>
            <div style={css('position:absolute;inset:0;z-index:1;opacity:.5;background-image:linear-gradient(rgba(111,227,160,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,160,.06) 1px,transparent 1px);background-size:26px 26px')} />
            <div style={css('position:absolute;right:34px;bottom:34px;z-index:1;width:130px;height:130px;opacity:.55;background-image:radial-gradient(circle,rgba(111,227,160,.5) 2px,transparent 2.5px);background-size:26px 26px')} />
          </>
        )}
      </div>

      <div style={vm.loginFormWrapStyle}>
        <div style={css('width:100%;max-width:360px;animation:fadeUp .35s ease')}>
          {isSignUp ? (
            /* --- Sign Up View --- */
            <form onSubmit={handleSignUp} noValidate>
              <div style={css('font-size:21px;font-weight:700;letter-spacing:-.3px;margin-bottom:5px')}>
                Create an account
              </div>
              <div style={css('font-size:13px;color:#7a807a;margin-bottom:22px')}>
                Enter your User ID to register
              </div>

              {error && (
                <div style={css('display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:10px 12px;border-radius:8px;font-size:12.5px;margin-bottom:16px;line-height:1.4')}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <label htmlFor="signup-user-id" style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>
                User ID
              </label>
              <HInput
                id="signup-user-id"
                type="text"
                autoComplete="username"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  vm.setLoginEmail(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={css("width:100%;border:1px solid #dde0d9;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;margin-bottom:14px;background:#fff")}
                focus={{ borderColor: '#9bb0e8' }}
              />

              <label htmlFor="signup-pass" style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>
                Password
              </label>
              <HInput
                id="signup-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={css("width:100%;border:1px solid #dde0d9;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;margin-bottom:14px;background:#fff")}
                focus={{ borderColor: '#9bb0e8' }}
              />

              <label htmlFor="signup-confirm-pass" style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>
                Confirm password
              </label>
              <HInput
                id="signup-confirm-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={css("width:100%;border:1px solid #dde0d9;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;margin-bottom:20px;background:#fff")}
                focus={{ borderColor: '#9bb0e8' }}
              />

              <HButton
                type="submit"
                disabled={loading}
                style={css(`width:100%;background:#15191e;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:600;cursor:${loading ? 'not-allowed' : 'pointer'};font-family:'Archivo',sans-serif;margin-bottom:16px;opacity:${loading ? 0.75 : 1}`)}
                hover={{ background: '#23282e' }}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </HButton>

              <div style={css('font-size:13px;color:#6b726c;text-align:center;margin-bottom:26px')}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={switchToSignIn}
                  style={css("background:none;border:none;padding:0;color:#15191e;font-weight:600;font-size:13px;cursor:pointer;text-decoration:underline;font-family:'Archivo',sans-serif")}
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : (
            /* --- Sign In View --- */
            <form onSubmit={handleSignIn} noValidate>
              <div style={css('font-size:21px;font-weight:700;letter-spacing:-.3px;margin-bottom:5px')}>
                Sign in
              </div>
              <div style={css('font-size:13px;color:#7a807a;margin-bottom:22px')}>
                Enter your User ID to sign in
              </div>

              {success && (
                <div style={css('display:flex;align-items:flex-start;gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:10px 12px;border-radius:8px;font-size:12.5px;margin-bottom:16px;line-height:1.4')}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div style={css('display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:10px 12px;border-radius:8px;font-size:12.5px;margin-bottom:16px;line-height:1.4')}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <label htmlFor="login-user-id" style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>
                User ID
              </label>
              <HInput
                id="login-user-id"
                type="text"
                autoComplete="username"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  vm.setLoginEmail(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={css("width:100%;border:1px solid #dde0d9;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;margin-bottom:15px;background:#fff")}
                focus={{ borderColor: '#9bb0e8' }}
              />

              <label htmlFor="login-pass" style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>
                Password
              </label>
              <HInput
                id="login-pass"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  vm.setLoginPass(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={css("width:100%;border:1px solid #dde0d9;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;margin-bottom:20px;background:#fff")}
                focus={{ borderColor: '#9bb0e8' }}
              />

              <HButton
                type="submit"
                disabled={loading}
                style={css(`width:100%;background:#15191e;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:600;cursor:${loading ? 'not-allowed' : 'pointer'};font-family:'Archivo',sans-serif;margin-bottom:16px;opacity:${loading ? 0.75 : 1}`)}
                hover={{ background: '#23282e' }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </HButton>

              <div style={css('font-size:13px;color:#6b726c;text-align:center;margin-bottom:26px')}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={switchToSignUp}
                  style={css("background:none;border:none;padding:0;color:#15191e;font-weight:600;font-size:13px;cursor:pointer;text-decoration:underline;font-family:'Archivo',sans-serif")}
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          <div style={css('font-size:11px;color:#a6aca2;text-align:center;line-height:1.5')}>
            QA Operations - UTAC<br />Protected internal system - authorized staff only
          </div>
        </div>
      </div>
    </div>
  );
}
