import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

export function EditScopeModal({ vm }: { vm: VM }) {
  const prompt = vm.editScopePrompt;
  if (!prompt || !prompt.open) return null;

  return (
    <div
      onClick={vm.closeEditScopePrompt}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 20, 25, 0.55)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn .12s ease',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '26px 28px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          border: '1px solid #e2e5de',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#15191e', letterSpacing: '-0.2px' }}>
                Edit Multi-Day Appointment
              </div>
              <div style={{ fontSize: '12px', color: '#5c625c', marginTop: '2px' }}>
                Choose which days you would like to edit
              </div>
            </div>
          </div>
          <HButton
            onClick={vm.closeEditScopePrompt}
            style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#f1f3ee' }}
          >
            ✕
          </HButton>
        </div>

        {/* Appointment Context Info Box */}
        <div
          style={{
            background: '#f8faf6',
            border: '1px solid #e2e8df',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#15191e' }}>
            {prompt.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5c625c', flexWrap: 'wrap' }}>
            <span>Full Visit: <strong style={{ color: '#2756d6' }}>{prompt.fullRangeStr}</strong> ({prompt.totalDays} days)</span>
            <span>·</span>
            <span>Selected Date: <strong style={{ color: '#166534' }}>{prompt.singleDateStr}</strong></span>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Option A: Single Day */}
          <button
            type="button"
            onClick={() => vm.chooseEditScope('day')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1.5px solid #22c55e',
              background: '#f0fdf4',
              cursor: 'pointer',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dcfce7';
              e.currentTarget.style.borderColor = '#16a34a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0fdf4';
              e.currentTarget.style.borderColor = '#22c55e';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>
                Edit this day only ({prompt.singleDateStr})
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#22c55e',
                  color: '#fff',
                }}
              >
                Day Scope
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.4' }}>
              Override or update Site, QMS Host, Customer, or Purpose for <strong>{prompt.singleDateStr}</strong> only. Other days of this visit remain unchanged.
            </div>
          </button>

          {/* Option B: Entire Appointment */}
          <button
            type="button"
            onClick={() => vm.chooseEditScope('all')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1f2937' }}>
                Edit entire appointment ({prompt.fullRangeStr})
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#e5e7eb',
                  color: '#4b5563',
                }}
              >
                All Days
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
              Modify details or date range across all {prompt.totalDays} scheduled days.
            </div>
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={vm.closeEditScopePrompt}
            style={{
              padding: '8px 18px',
              border: '1px solid #dde0d9',
              background: '#f4f6f1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#3c423d',
              fontFamily: "'Archivo', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
