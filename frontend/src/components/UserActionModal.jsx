// src/components/UserActionModal.jsx
import { useState } from 'react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import {
  X, Flag, ShieldOff, Ban, AlertTriangle, CheckCircle,
  Loader, ChevronRight, User, Clock, FileText, Scale,
  Info, ArrowLeft,
} from 'lucide-react';

const ACTIONS = {
  flag: {
    key:                  'flag',
    label:                'Flag Account',
    newStatus:            'flagged',
    icon:                 Flag,
    color:                'text-amber-700',
    bg:                   'bg-amber-50',
    border:               'border-amber-300',
    headerBg:             'bg-amber-700',
    btnBg:                'bg-amber-600 hover:bg-amber-700',
    severity:             'warning',
    auditAction:          'flag',
    description:          'Flags the account for review. The user can still log in and submit reports, but the account is marked as under investigation.',
    procedure: [
      'Document the reason for flagging in the notes field below.',
      'The user will remain active but their submissions will be reviewed with extra scrutiny.',
      'Follow up within 48 hours with a final determination (suspend or clear).',
      'A flag can be cleared at any time by updating the account status back to Active.',
    ],
    requiresReason:        true,
    requiresDuration:      false,
    requiresDoubleConfirm: false,
    confirmLabel:          'Flag Account',
  },
  suspend: {
    key:                  'suspend',
    label:                'Suspend Account',
    newStatus:            'suspended',
    icon:                 ShieldOff,
    color:                'text-orange-700',
    bg:                   'bg-orange-50',
    border:               'border-orange-300',
    headerBg:             'bg-orange-700',
    btnBg:                'bg-orange-600 hover:bg-orange-700',
    severity:             'critical',
    auditAction:          'suspend',
    description:          'Temporarily blocks the user from logging in and submitting new reports. Existing reports are preserved.',
    procedure: [
      'A valid documented reason is required before suspension.',
      'Specify a suspension duration (or leave open-ended for indefinite).',
      'The user will be blocked from logging in immediately after this action.',
      'The account must be manually reactivated by an administrator after review.',
      'Suspension is appropriate for repeated false alarms, abuse, or policy violations.',
    ],
    requiresReason:        true,
    requiresDuration:      true,
    requiresDoubleConfirm: false,
    confirmLabel:          'Suspend Account',
  },
  ban: {
    key:                  'ban',
    label:                'Permanently Ban',
    newStatus:            'suspended',
    icon:                 Ban,
    color:                'text-red-700',
    bg:                   'bg-red-50',
    border:               'border-red-300',
    headerBg:             'bg-red-800',
    btnBg:                'bg-red-700 hover:bg-red-800',
    severity:             'critical',
    auditAction:          'ban',
    description:          "Permanently removes the user's access to the system. This action is irreversible without direct database intervention.",
    procedure: [
      'This action is PERMANENT and should only be used for serious violations.',
      'Grounds for a permanent ban: criminal threats, repeated abuse after suspension, fraud, or impersonation.',
      'A detailed reason must be provided and will be stored in the audit log.',
      'A second confirmation phrase is required due to the irreversible nature of this action.',
      'Banned accounts cannot be reinstated through the normal admin interface.',
    ],
    requiresReason:        true,
    requiresDuration:      false,
    requiresDoubleConfirm: true,
    confirmLabel:          'Permanently Ban User',
  },
};

const DURATION_OPTIONS = [
  { label: '24 Hours',                             value: '24h'        },
  { label: '3 Days',                               value: '3d'         },
  { label: '7 Days',                               value: '7d'         },
  { label: '14 Days',                              value: '14d'        },
  { label: '30 Days',                              value: '30d'        },
  { label: 'Indefinite (manual release required)', value: 'indefinite' },
];

export default function UserActionModal({ user, onClose, onSuccess }) {
  const [step,           setStep]          = useState('select');
  const [selectedAction, setSelectedAction]= useState(null);
  const [reason,         setReason]        = useState('');
  const [duration,       setDuration]      = useState('7d');
  const [doubleConfirm,  setDoubleConfirm] = useState('');
  const [processing,     setProcessing]    = useState(false);
  const [error,          setError]         = useState(null);

  if (!user) return null;

  const displayName =
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.email ||
    'Unknown User';

  const action      = selectedAction ? ACTIONS[selectedAction] : null;
  const ActionIcon  = action?.icon ?? Flag;
  const needsDouble = action?.requiresDoubleConfirm ?? false;
  const confirmMatch= doubleConfirm.trim().toLowerCase() === 'confirm ban';

  const handleSelectAction = (key) => { setSelectedAction(key); setStep('procedure'); };
  const handleBackToSelect = () => { setStep('select'); setError(null); };
  const handleProceedToConfirm = () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide a reason of at least 10 characters.');
      return;
    }
    setError(null);
    setStep('confirm');
  };
  const handleBackToProcedure = () => { setStep('procedure'); setError(null); };

  const handleExecute = async () => {
    if (needsDouble && !confirmMatch) {
      setError('Type "confirm ban" exactly to proceed.');
      return;
    }
    if (!user?.id) {
      setError('Cannot apply action: this user has no linked account ID. Use the Residents directory to manage accounts directly.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const durationLabel     = DURATION_OPTIONS.find(o => o.value === duration)?.label ?? duration;
      const now               = new Date();

      let suspensionExpiresAt = null;
      if (action.requiresDuration && duration !== 'indefinite') {
        const ms = { '24h': 864e5, '3d': 259.2e6, '7d': 604.8e6, '14d': 1209.6e6, '30d': 2592e6 }[duration];
        if (ms) suspensionExpiresAt = new Date(now.getTime() + ms).toISOString();
      }

      const noteLines = [
        `[${action.label.toUpperCase()} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}]`,
        `Reason: ${reason.trim()}`,
        action.requiresDuration ? `Duration: ${durationLabel}` : null,
        action.key === 'ban'    ? '[PERMANENT BAN — reinstatement requires direct DB access]' : null,
      ].filter(Boolean).join('\n');

      let adminUserId = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        adminUserId = authData?.user?.id ?? null;
      } catch { /* non-fatal */ }

      // Build update payload — flag action does NOT touch is_banned / suspension_expires_at
      const updatePayload = {
        account_status:     action.newStatus,
        admin_action_notes: noteLines,
        action_taken_by:    adminUserId,
        action_taken_at:    now.toISOString(),
        updated_at:         now.toISOString(),
      };

      if (action.key === 'ban') {
        updatePayload.is_banned             = true;
        updatePayload.suspension_expires_at = null;
      } else if (action.key === 'suspend') {
        updatePayload.is_banned             = false;
        updatePayload.suspension_expires_at = suspensionExpiresAt;
      }
      // flag: leave is_banned / suspension_expires_at as-is

      const { data: updatedRows, error: dbErr } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id)
        .select('id, account_status');

      if (dbErr) throw new Error(dbErr.message || 'Database update failed');

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          'Update was blocked — no rows changed. This is almost always a Row Level Security (RLS) policy. ' +
          'Run rls_fix.sql in your Supabase SQL editor to grant admin update access, then try again.'
        );
      }

      try {
        await logAuditAction({
          action:      action.auditAction,
          actionType:  'user',
          description: `${action.label}: ${displayName} (${user.email ?? user.id}). Reason: ${reason.trim()}${action.requiresDuration ? `. Duration: ${durationLabel}` : ''}`,
          severity:    action.severity,
          targetId:    user.id,
          targetType:  'user',
          targetName:  displayName,
          newValues: {
            account_status:        action.newStatus,
            is_banned:             action.key === 'ban',
            suspension_expires_at: suspensionExpiresAt,
            action:                action.key,
            reason:                reason.trim(),
            duration:              action.requiresDuration ? duration : null,
          },
        });
      } catch (auditErr) {
        console.warn('Audit log failed (non-fatal):', auditErr);
      }

      setStep('done');
    } catch (err) {
      console.error('UserActionModal execute error:', err);
      setError(err.message || 'Failed to apply action. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = () => { onSuccess?.(); onClose(); };

  // ── STEP: select ────────────────────────────────────────────────────────────
  if (step === 'select') return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between rounded-t-lg">
          <div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-1">Account Enforcement</p>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Take Action on User</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <p className="text-slate-300 text-xs">{displayName}</p>
              {user.email && <span className="text-slate-500 text-xs">· {user.email}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              All account actions are permanently logged in the audit trail and require a documented reason.
            </p>
          </div>

          {!user?.id && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 font-medium leading-relaxed">
                <strong>No account ID found.</strong> This user was opened from a report or emergency that doesn't include a linked user ID.
                Use the Residents directory to take action on their account.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Current Status:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
              user.account_status === 'active'    ? 'bg-green-100 text-green-700' :
              user.account_status === 'flagged'   ? 'bg-amber-100 text-amber-700' :
              user.account_status === 'suspended' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-600'
            }`}>{user.account_status ?? 'active'}</span>
            {user.phone && <span className="text-xs text-slate-400 ml-auto">{user.phone}</span>}
          </div>

          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest pt-1">Select an action:</p>

          {Object.values(ACTIONS).map(a => {
            const Icon = a.icon;
            return (
              <button key={a.key} onClick={() => handleSelectAction(a.key)} disabled={!user?.id}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                  a.key === 'ban'     ? 'border-red-200 hover:border-red-400 bg-white hover:bg-red-50' :
                  a.key === 'suspend' ? 'border-orange-200 hover:border-orange-400 bg-white hover:bg-orange-50' :
                                       'border-amber-200 hover:border-amber-400 bg-white hover:bg-amber-50'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bg} border ${a.border}`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{a.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs leading-snug">{a.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-3" />
              </button>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 rounded-b-lg">
          <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Cancel — No Action
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: procedure ─────────────────────────────────────────────────────────
  if (step === 'procedure' && action) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className={`${action.headerBg} px-6 py-4 flex items-start justify-between rounded-t-lg`}>
          <div>
            <p className="text-xs text-white/60 font-mono uppercase tracking-widest mb-1">Step 2 of 3 — Review Procedure</p>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ActionIcon className="w-4 h-4" /> {action.label}
            </h2>
            <p className="text-white/70 text-xs mt-1">{displayName}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className={`rounded-lg border ${action.border} ${action.bg} p-4`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 ${action.color}`}>
              <Scale className="w-3.5 h-3.5" /> Required Procedure
            </p>
            <ol className="space-y-2">
              {action.procedure.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 ${action.bg} border ${action.border} ${action.color}`}>
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
              Documented Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={
                action.key === 'flag'    ? 'e.g. Multiple unverified reports filed in short succession. Under review for potential abuse.' :
                action.key === 'suspend' ? 'e.g. Filed 3 confirmed false emergency alarms on 2024-11-12. Repeated violation of platform rules.' :
                'e.g. User repeatedly filed fraudulent emergency reports after prior suspension. Poses a risk to emergency response resources.'
              }
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1">{reason.length} characters — minimum 20 recommended</p>
          </div>

          {action.requiresDuration && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                Suspension Duration <span className="text-red-500">*</span>
              </label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white">
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {duration !== 'indefinite' && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Account will be flagged for review after period ends. Manual reactivation required.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2 rounded-b-lg">
          <button onClick={handleBackToSelect}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={handleProceedToConfirm}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded transition-colors ${action.btnBg}`}>
            Next — Review & Confirm <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: confirm ───────────────────────────────────────────────────────────
  if (step === 'confirm' && action) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className={`${action.headerBg} px-6 py-4 flex items-start justify-between rounded-t-lg`}>
          <div>
            <p className="text-xs text-white/60 font-mono uppercase tracking-widest mb-1">Step 3 of 3 — Confirm Action</p>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Review Before Applying
            </h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="border-2 border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Action Summary</p>
            </div>
            <div className="p-4 space-y-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${action.bg} border ${action.border}`}>
                  <ActionIcon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{action.label}</p>
                  <p className="text-xs text-slate-500">
                    Status → <strong className="text-slate-700">{action.newStatus}</strong>
                    {action.key === 'ban' && <span className="text-red-600 font-bold ml-1">(Permanent)</span>}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-slate-200 rounded p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">User</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{user.email ?? 'N/A'}</p>
                </div>
              </div>
              {action.requiresDuration && (
                <div className="bg-white border border-slate-200 rounded p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Duration</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {DURATION_OPTIONS.find(o => o.value === duration)?.label}
                  </p>
                </div>
              )}
              <div className="bg-white border border-slate-200 rounded p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Documented Reason</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{reason.trim()}</p>
              </div>
            </div>
          </div>

          {needsDouble && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Irreversible — Double Confirmation Required
              </p>
              <p className="text-xs text-red-700 mb-3 leading-relaxed">
                This action <strong>cannot be undone</strong> through the admin interface. Type{' '}
                <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono font-bold">confirm ban</code> to proceed.
              </p>
              <input type="text" value={doubleConfirm} onChange={e => setDoubleConfirm(e.target.value)}
                placeholder='Type "confirm ban" here'
                className="w-full px-3 py-2.5 border border-red-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2 rounded-b-lg">
          <button onClick={handleBackToProcedure} disabled={processing}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={handleExecute} disabled={processing || (needsDouble && !confirmMatch)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded transition-colors disabled:opacity-40 ${action.btnBg}`}>
            {processing
              ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Applying...</>
              : <><ActionIcon className="w-3.5 h-3.5" /> {action.confirmLabel}</>
            }
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: done ──────────────────────────────────────────────────────────────
  if (step === 'done' && action) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Action Applied</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${action.bg} border-2 ${action.border}`}>
            <ActionIcon className={`w-8 h-8 ${action.color}`} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">{action.label} Applied</h3>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            <strong className="text-slate-700">{displayName}</strong>'s account status has been updated to{' '}
            <strong className={action.color}>{action.newStatus}</strong>. This action has been recorded in the audit log.
          </p>
          {action.requiresDuration && duration !== 'indefinite' && (
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              <Clock className="w-3.5 h-3.5" />
              Duration: {DURATION_OPTIONS.find(o => o.value === duration)?.label} — Manual review required after period ends.
            </p>
          )}
          {action.key === 'ban' && (
            <p className="text-xs text-red-600 font-semibold mt-3 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-3 py-2">
              <Ban className="w-3.5 h-3.5" /> Permanent ban applied — database intervention required to reinstate.
            </p>
          )}
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <FileText className="w-3.5 h-3.5" />
            Audit log entry created at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 rounded-b-lg">
          <button onClick={handleDone}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded transition-colors">
            <CheckCircle className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}