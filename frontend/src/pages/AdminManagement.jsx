// src/pages/AdminManagement.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import {
  Shield, Clock, CheckCircle, XCircle, Plus, X,
  Eye, EyeOff, UserCog, RefreshCw, AlertCircle,
  Users, ChevronDown, ChevronUp, GripVertical,
  ArrowRightLeft, Trash2, MoveRight, AlertTriangle,
} from 'lucide-react';

// ─── Team Definitions ─────────────────────────────────────────────────────────
const RESPONSE_TEAMS = [
  {
    value:       'bpso',
    label:       'BPSO Team',
    description: 'Barangay Public Safety Officers',
    color:       'bg-blue-50 text-blue-700 border-blue-300',
    dot:         'bg-blue-500',
    header:      'bg-blue-700',
    headerHover: 'bg-blue-800',
    accent:      '#1d4ed8',
    dropBg:      'bg-blue-50/80 border-blue-400',
  },
  {
    value:       'disaster',
    label:       'Disaster Response',
    description: 'Emergency & disaster operations',
    color:       'bg-orange-50 text-orange-700 border-orange-300',
    dot:         'bg-orange-500',
    header:      'bg-orange-700',
    headerHover: 'bg-orange-800',
    accent:      '#c2410c',
    dropBg:      'bg-orange-50/80 border-orange-400',
  },
  {
    value:       'bhert',
    label:       'BHERT',
    description: 'Barangay Health Emergency Response',
    color:       'bg-green-50 text-green-700 border-green-300',
    dot:         'bg-green-500',
    header:      'bg-green-700',
    headerHover: 'bg-green-800',
    accent:      '#15803d',
    dropBg:      'bg-green-50/80 border-green-400',
  },
  {
    value:       'general',
    label:       'General Response',
    description: 'Multi-purpose barangay responders',
    color:       'bg-slate-50 text-slate-700 border-slate-300',
    dot:         'bg-slate-400',
    header:      'bg-slate-600',
    headerHover: 'bg-slate-700',
    accent:      '#475569',
    dropBg:      'bg-slate-50/80 border-slate-400',
  },
];

const getTeam = (value) => RESPONSE_TEAMS.find(t => t.value === value) || RESPONSE_TEAMS[3];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded border shadow-lg text-sm font-semibold max-w-sm ${
      type === 'success' ? 'bg-green-50 text-green-800 border-green-300' :
      type === 'error'   ? 'bg-red-50 text-red-800 border-red-300' :
                           'bg-blue-50 text-blue-800 border-blue-300'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-60 transition-opacity"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 w-fit">
      {[
        { id: 'admins',     label: 'Admin Users',    icon: Shield },
        { id: 'responders', label: 'Response Teams', icon: Users  },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            active === id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />{label}
        </button>
      ))}
    </div>
  );
}

// ─── Move Responder Modal ─────────────────────────────────────────────────────
function MoveResponderModal({ responder, currentTeam, onClose, onMove }) {
  const [targetTeam, setTargetTeam] = useState('');
  const [loading, setLoading]       = useState(false);

  const handleMove = async () => {
    if (!targetTeam || targetTeam === currentTeam) return;
    setLoading(true);
    await onMove(responder, targetTeam);
    setLoading(false);
    onClose();
  };

  const fromTeam = getTeam(currentTeam);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5" />Move Responder
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Transfer to a different team</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Responder info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className={`w-10 h-10 ${fromTeam.header} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {responder.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{responder.name}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${fromTeam.color}`}>
                {fromTeam.label}
              </span>
            </div>
            <MoveRight className="w-4 h-4 text-slate-400 ml-auto" />
          </div>

          {/* Target team selection */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Move to Team</p>
            <div className="space-y-2">
              {RESPONSE_TEAMS.filter(t => t.value !== currentTeam).map(team => (
                <button
                  key={team.value}
                  onClick={() => setTargetTeam(team.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    targetTeam === team.value
                      ? 'border-slate-700 bg-slate-800'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 ${team.header} rounded flex items-center justify-center flex-shrink-0`}>
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${targetTeam === team.value ? 'text-white' : 'text-slate-900'}`}>{team.label}</p>
                    <p className={`text-xs mt-0.5 ${targetTeam === team.value ? 'text-slate-300' : 'text-slate-500'}`}>{team.description}</p>
                  </div>
                  {targetTeam === team.value && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={loading || !targetTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50"
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Moving...</>
              : <><ArrowRightLeft className="w-3.5 h-3.5" />Confirm Move</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Remove Responder Confirm Modal ───────────────────────────────────────────
function RemoveResponderModal({ responder, onClose, onRemove }) {
  const [loading, setLoading] = useState(false);
  const team = getTeam(responder?.team);

  const handleRemove = async () => {
    setLoading(true);
    await onRemove(responder);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-200" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Remove Responder</h2>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className={`w-10 h-10 ${team.header} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {responder?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{responder?.name}</p>
              <p className="text-xs text-slate-500">{responder?.user?.email || 'No email linked'}</p>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
            <p className="text-xs font-bold text-red-700">This action will:</p>
            <ul className="space-y-1">
              {[
                'Remove this responder from all team assignments',
                'Revoke their access to the responder mobile app',
                'Preserve their account in the user records',
              ].map((item, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing...</>
              : <><Trash2 className="w-3.5 h-3.5" />Remove Responder</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ mode, onClose, onSuccess }) {
  const isResponder = mode === 'responder';
  const [form, setForm]             = useState({ full_name:'', email:'', password:'', role: isResponder?'':'operator', team: isResponder?'bpso':'' });
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name || !form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('create-admin-user', {
        body: { full_name: form.full_name, email: form.email, password: form.password, role: isResponder ? undefined : form.role.toLowerCase(), team: isResponder ? form.team : undefined, user_type: isResponder ? 'responder' : 'admin' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      await logAuditAction({ action: isResponder ? 'create_responder' : 'create_admin', actionType: 'admin_management', description: isResponder ? `Created responder: ${form.email} (team: ${form.team})` : `Created admin: ${form.email} (${form.role})`, severity: 'info' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">{isResponder ? 'Add Responder' : 'Create Admin User'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isResponder ? 'Register a new barangay responder account' : 'Add a new operator or system administrator'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
          {[
            { key: 'full_name', label: isResponder ? 'Responder Name' : 'Full Name', type: 'text', placeholder: isResponder ? 'Alpha Unit 1' : 'Juan dela Cruz' },
            { key: 'email',     label: 'Email Address', type: 'email', placeholder: isResponder ? 'responder@barangay.gov.ph' : 'operator@barangay.gov.ph' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50" placeholder={placeholder} disabled={loading} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition disabled:opacity-50" placeholder="Min. 8 characters" disabled={loading} />
              <button type="button" onClick={() => setShowPass(p => !p)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {!isResponder && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value:'operator', label:'Operator', desc:'Standard access' }, { value:'system_administrator', label:'System Admin', desc:'Full access' }].map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))} className={`p-3 rounded border text-left transition-all ${form.role === r.value ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <p className={`text-xs font-bold ${form.role === r.value ? 'text-white' : 'text-slate-900'}`}>{r.label}</p>
                    <p className={`text-xs mt-0.5 ${form.role === r.value ? 'text-slate-300' : 'text-slate-500'}`}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isResponder && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Assign to Team</label>
              <div className="grid grid-cols-2 gap-2">
                {RESPONSE_TEAMS.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, team: t.value }))} className={`p-3 rounded border text-left transition-all ${form.team === t.value ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <p className={`text-xs font-bold ${form.team === t.value ? 'text-white' : 'text-slate-900'}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${form.team === t.value ? 'text-slate-300' : 'text-slate-500'}`}>{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
              {loading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><Plus className="w-3.5 h-3.5" />{isResponder ? 'Add Responder' : 'Create Admin'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Responder Row (draggable) ────────────────────────────────────────────────
function ResponderRow({ responder, team, onMove, onRemove, isDragging, dragHandleProps }) {
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60)   return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400)return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const statusStyle = {
    available: 'bg-green-50 text-green-700 border-green-300',
    busy:      'bg-amber-50 text-amber-700 border-amber-300',
    offline:   'bg-slate-50 text-slate-500 border-slate-300',
  }[responder.status] || 'bg-slate-50 text-slate-500 border-slate-300';

  const statusDot = {
    available: 'bg-green-500',
    busy:      'bg-amber-500',
    offline:   'bg-slate-400',
  }[responder.status] || 'bg-slate-400';

  return (
    <tr
      className={`group transition-colors ${isDragging ? 'opacity-50' : 'hover:bg-slate-50'}`}
    >
      {/* Drag handle */}
      <td className="pl-3 pr-1 py-3.5 w-8">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          title="Drag to move team"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${team.header} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {responder.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{responder.name}</p>
            {responder.user?.email
              ? <p className="text-xs text-slate-500">{responder.user.email}</p>
              : <p className="text-xs text-amber-600 font-medium">No linked account</p>
            }
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize ${statusStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {responder.status || 'offline'}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {timeAgo(responder.last_updated)}
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
        {responder.current_lat && responder.current_lng
          ? `${responder.current_lat.toFixed(4)}, ${responder.current_lng.toFixed(4)}`
          : <span className="text-slate-400 font-sans">No GPS</span>
        }
      </td>
      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMove(responder)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors"
            title="Move to different team"
          >
            <ArrowRightLeft className="w-3 h-3" />Move
          </button>
          <button
            onClick={() => onRemove(responder)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-200 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 transition-colors"
            title="Remove responder"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Team Card with drag-and-drop ─────────────────────────────────────────────
function TeamCard({ team, members, onMoveResponder, onRemoveResponder, draggingResponder, onDragStart, onDragEnd }) {
  const [expanded, setExpanded]   = useState(true);
  const [isDragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (draggingResponder && (draggingResponder.team || 'bpso') !== team.value) {
      setDragOver(true);
    }
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (draggingResponder && (draggingResponder.team || 'bpso') !== team.value) {
      onMoveResponder(draggingResponder, team.value);
    }
  };

  const available = members.filter(r => r.status === 'available').length;
  const busy      = members.filter(r => r.status === 'busy').length;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg shadow-sm overflow-hidden border-2 transition-all duration-150 ${
        isDragOver
          ? `${team.dropBg} border-dashed scale-[1.005]`
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Card header */}
      <div className={`${team.header} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{team.label}</h3>
            <p className="text-xs text-white/70">{team.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300" />{available} available
            </span>
            {busy > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />{busy} busy
              </span>
            )}
            <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{members.length}</span>
          </div>
          <button onClick={() => setExpanded(p => !p)} className="text-white/70 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Drop zone hint */}
      {isDragOver && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm font-bold border-b border-dashed border-current" style={{ color: team.accent }}>
          <MoveRight className="w-4 h-4" />
          Drop to move to {team.label}
        </div>
      )}

      {expanded && (
        members.length === 0 ? (
          <div
            className={`text-center py-10 transition-colors ${isDragOver ? 'bg-transparent' : ''}`}
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No members assigned</p>
            <p className="text-xs text-slate-400 mt-1">Drag a responder here or use the Move button</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="w-8 px-3 py-2.5 bg-slate-50" />
                  {['Responder', 'Status', 'Last Active', 'Location', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map(r => (
                  <ResponderRow
                    key={r.id}
                    responder={r}
                    team={team}
                    onMove={onMoveResponder}
                    onRemove={onRemoveResponder}
                    isDragging={draggingResponder?.id === r.id}
                    dragHandleProps={{
                      draggable: true,
                      onDragStart: () => onDragStart(r),
                      onDragEnd:   onDragEnd,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ─── Responders Tab ───────────────────────────────────────────────────────────
function RespondersTab({ showToast }) {
  const [responders,      setResponders]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [movingResponder, setMovingResponder] = useState(null);
  const [removingResponder, setRemovingResponder] = useState(null);
  const [draggingResponder, setDraggingResponder] = useState(null);

  useEffect(() => { fetchResponders(); }, []);

  const fetchResponders = async () => {
    setLoading(true);
    try {
      const { data: responderData, error } = await supabase
        .from('responders').select('*').order('last_updated', { ascending: false, nullsFirst: false });
      if (error) throw error;
      if (!responderData?.length) { setResponders([]); return; }
      const { data: usersData } = await supabase.from('users').select('id, email, account_status').in('id', responderData.map(r => r.id));
      const usersMap = Object.fromEntries((usersData || []).map(u => [u.id, u]));
      setResponders(responderData.map(r => ({ ...r, user: usersMap[r.id] || null })));
    } catch (err) {
      console.error('fetchResponders error:', err);
      showToast('Failed to load responders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Move responder to a different team ─────────────────────────────────────
  const handleMove = async (responder, targetTeam) => {
    try {
      const { error } = await supabase
        .from('responders')
        .update({ team: targetTeam })
        .eq('id', responder.id);
      if (error) throw error;

      // Optimistic update
      setResponders(prev => prev.map(r => r.id === responder.id ? { ...r, team: targetTeam } : r));

      await logAuditAction({
        action:      'move_responder',
        actionType:  'admin_management',
        description: `Moved responder ${responder.name} from ${responder.team || 'bpso'} to ${targetTeam}`,
        severity:    'info',
      });

      const toTeam = getTeam(targetTeam);
      showToast(`${responder.name} moved to ${toTeam.label}`);
    } catch (err) {
      showToast(err.message || 'Failed to move responder', 'error');
      fetchResponders(); // re-sync
    }
  };

  // ── Remove responder ───────────────────────────────────────────────────────
  const handleRemove = async (responder) => {
    try {
      const { error } = await supabase
        .from('responders')
        .delete()
        .eq('id', responder.id);
      if (error) throw error;

      setResponders(prev => prev.filter(r => r.id !== responder.id));

      await logAuditAction({
        action:      'remove_responder',
        actionType:  'admin_management',
        description: `Removed responder ${responder.name} (${responder.user?.email || 'no email'}) from team ${responder.team || 'bpso'}`,
        severity:    'warning',
      });

      showToast(`${responder.name} removed from response teams`);
    } catch (err) {
      showToast(err.message || 'Failed to remove responder', 'error');
    }
  };

  const totalAvailable = responders.filter(r => r.status === 'available').length;
  const totalBusy      = responders.filter(r => r.status === 'busy').length;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Responders', value: responders.length,    color: 'text-slate-700' },
          { label: 'Available',        value: totalAvailable,        color: 'text-green-600' },
          { label: 'On Duty',          value: totalBusy,             color: 'text-amber-600' },
          { label: 'Teams',            value: RESPONSE_TEAMS.length, color: 'text-blue-600'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Response Teams</h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <GripVertical className="w-3 h-3" />
            Drag responders between cards to reassign teams
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />Add Responder
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {RESPONSE_TEAMS.map(team => (
            <TeamCard
              key={team.value}
              team={team}
              members={responders.filter(r => (r.team || 'bpso') === team.value)}
              onMoveResponder={(responder, targetTeam) => {
                if (targetTeam) {
                  // Called from drag drop with target known
                  handleMove(responder, targetTeam);
                } else {
                  // Called from Move button — open modal
                  setMovingResponder(responder);
                }
              }}
              onRemoveResponder={setRemovingResponder}
              draggingResponder={draggingResponder}
              onDragStart={setDraggingResponder}
              onDragEnd={() => setDraggingResponder(null)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal mode="responder" onClose={() => setShowCreateModal(false)} onSuccess={fetchResponders} />
      )}
      {movingResponder && (
        <MoveResponderModal
          responder={movingResponder}
          currentTeam={movingResponder.team || 'bpso'}
          onClose={() => setMovingResponder(null)}
          onMove={handleMove}
        />
      )}
      {removingResponder && (
        <RemoveResponderModal
          responder={removingResponder}
          onClose={() => setRemovingResponder(null)}
          onRemove={handleRemove}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const [tab,             setTab]             = useState('admins');
  const [admins,          setAdmins]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading,   setActionLoading]   = useState(null);
  const [toggleError,     setToggleError]     = useState('');
  const [toast,           setToast]           = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('fetchAdmins error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (admin) => {
    if (actionLoading) return;
    setActionLoading(admin.id);
    setToggleError('');
    const newStatus = !admin.is_active;
    setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: newStatus } : a));
    try {
      const { data, error } = await supabase.from('admin_users').update({ is_active: newStatus }).eq('email', admin.email).select('id, email, is_active');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(`No row matched email "${admin.email}"`);
      await logAuditAction({ action: newStatus ? 'activate_admin' : 'deactivate_admin', actionType: 'admin_management', description: `${newStatus ? 'Activated' : 'Deactivated'} admin: ${admin.email}`, severity: 'info' });
      showToast(`${admin.full_name} ${newStatus ? 'activated' : 'deactivated'}`);
      await fetchAdmins();
    } catch (err) {
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: admin.is_active } : a));
      setToggleError(err?.message?.includes('row-level security') ? 'Permission denied. Your account may not have rights to modify admins.' : err?.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60)   return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400)return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const sysAdmins = admins.filter(a => a.role === 'system_administrator');
  const operators  = admins.filter(a => a.role === 'operator');

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <UserCog className="w-3.5 h-3.5" />Admin Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage administrator accounts and response teams</p>
        </div>
        <div className="flex gap-2">
          <button onClick={tab === 'admins' ? fetchAdmins : undefined} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          {tab === 'admins' && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors shadow-sm">
              <Plus className="w-4 h-4" />New Admin
            </button>
          )}
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'admins' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Admins',  value: admins.length,                         color: 'text-slate-700' },
              { label: 'System Admins', value: sysAdmins.length,                      color: 'text-amber-600' },
              { label: 'Operators',     value: operators.length,                       color: 'text-blue-600'  },
              { label: 'Active',        value: admins.filter(a => a.is_active).length, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {toggleError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium flex-1">{toggleError}</p>
              <button onClick={() => setToggleError('')} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Admins table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />All Administrators
              </p>
              <span className="text-xs text-slate-400">{admins.length} total</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">No admin users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      {['Admin', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{admin.full_name}</p>
                              <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${admin.role === 'system_administrator' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-300'}`}>
                            <Shield className="w-3 h-3" />
                            {admin.role === 'system_administrator' ? 'System Admin' : 'Operator'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {admin.is_active
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3" />Active</span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3" />Inactive</span>
                          }
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />{timeAgo(admin.last_login)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(admin.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleActive(admin)}
                            disabled={actionLoading === admin.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${admin.is_active ? 'bg-white border-red-300 text-red-600 hover:bg-red-50' : 'bg-white border-green-300 text-green-600 hover:bg-green-50'}`}
                          >
                            {actionLoading === admin.id
                              ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              : admin.is_active ? <><XCircle className="w-3.5 h-3.5" />Deactivate</> : <><CheckCircle className="w-3.5 h-3.5" />Activate</>
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <RespondersTab showToast={showToast} />
      )}

      {showCreateModal && (
        <CreateUserModal mode="admin" onClose={() => setShowCreateModal(false)} onSuccess={fetchAdmins} />
      )}
    </div>
  );
}