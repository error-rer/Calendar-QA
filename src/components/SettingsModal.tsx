import type { VM } from '../useScheduler';
import type { ThemeMode } from '../theme';
import { getSystemTheme } from '../theme';
import { css, HButton } from '../ui';

export function SettingsModal({ vm }: { vm: VM }) {
  if (!vm.settingsOpen) return null;

  const currentTheme = vm.theme;
  const effectiveTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;

  const options: Array<{ id: ThemeMode; label: string; icon: string; desc: string }> = [
    { id: 'light', label: 'Light', icon: '☀️', desc: 'Classic bright interface' },
    { id: 'dark', label: 'Dark', icon: '🌙', desc: 'High contrast dark theme' },
    { id: 'system', label: 'System', icon: '💻', desc: 'Sync with OS preference' },
  ];

  return (
    <div
      onClick={vm.closeSettings}
      style={css(
        'position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .15s ease'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={css(
          'width:100%;max-width:480px;background:var(--bg-modal, #ffffff);border:1px solid var(--border-color, #e2e5de);border-radius:16px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.3);overflow:hidden;animation:fadeUp .15s ease'
        )}
      >
        {/* Modal Header */}
        <div style={css('display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border-color, #eef1ea)')}>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <div>
              <div style={css('font-size:16px;font-weight:700;color:var(--text-main, #15191e);letter-spacing:-.2px')}>Settings</div>
              <div style={css('font-size:11.5px;color:var(--text-muted, #8a9088);margin-top:1px')}>Application preferences & theme customization</div>
            </div>
          </div>
          <HButton
            onClick={vm.closeSettings}
            style={css('width:28px;height:28px;border-radius:8px;background:none;border:none;color:var(--text-muted, #8a9088);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px')}
            hover={{ background: 'var(--bg-subtle, #f4f6f1)', color: 'var(--text-main, #15191e)' }}
          >
            ✕
          </HButton>
        </div>

        {/* Modal Content Body */}
        <div style={css('padding:22px')}>
          {/* Theme Section */}
          <div style={css('margin-bottom:24px')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;color:var(--text-muted, #8a9088);letter-spacing:.6px;margin-bottom:6px")}>
              APPEARANCE & THEME
            </div>
            <div style={css('font-size:12.5px;color:var(--text-muted, #64748b);margin-bottom:14px')}>
              Choose your preferred visual theme for Calendar Auditor across all views.
            </div>

            {/* Segmented Switcher */}
            <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--bg-subtle, #f1f3ee);border:1px solid var(--border-color, #e0e3dc);border-radius:12px;padding:4px')}>
              {options.map((opt) => {
                const isActive = currentTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => vm.setTheme(opt.id)}
                    style={css(
                      `display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:9px;border:none;cursor:pointer;transition:all .15s ease;font-family:'Archivo',sans-serif;${
                        isActive
                          ? 'background:var(--bg-card, #ffffff);color:var(--text-main, #15191e);box-shadow:0 2px 8px rgba(0,0,0,0.12);font-weight:700;'
                          : 'background:transparent;color:var(--text-muted, #64748b);font-weight:500;'
                      }`
                    )}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '12.5px' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Theme Status Description */}
            <div style={css('margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--bg-subtle, #f8fafc);border:1px solid var(--border-color, #e2e8f0);display:flex;align-items:center;gap:8px')}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <span style={css('font-size:11.5px;color:var(--text-muted, #64748b)')}>
                <strong>Currently Active:</strong> {effectiveTheme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
                {currentTheme === 'system' ? ` (Synced with OS preference)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={css('padding:14px 22px;background:var(--bg-subtle, #fafbf9);border-top:1px solid var(--border-color, #eef1ea);display:flex;justify-content:flex-end')}>
          <HButton
            onClick={vm.closeSettings}
            style={css("background:#15191e;color:#ffffff;border:none;border-radius:9px;padding:8px 20px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            hover={{ background: '#2a3038' }}
          >
            Done
          </HButton>
        </div>
      </div>
    </div>
  );
}
