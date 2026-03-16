// src/pages/EmergencyEvidence.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Camera, Upload, Eye, X, CheckCircle, AlertCircle,
  Image as ImageIcon, MapPin, Clock, Download, Trash2,
  RefreshCw, Search, Maximize2, AlertTriangle, Shield,
  Heart, Flame, FileImage, User, Mail, Phone,
  ShieldCheck, Radio, Users,
} from 'lucide-react';

// ─── Emergency type config ─────────────────────────────────────────────────────
const EMERGENCY_TYPES = {
  Medical:  { icon: Heart,         color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-300',    badge: 'bg-red-50 text-red-700 border-red-300'       },
  Fire:     { icon: Flame,         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-50 text-orange-700 border-orange-300' },
  Crime:    { icon: Shield,        color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', badge: 'bg-purple-50 text-purple-700 border-purple-300' },
  Accident: { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-300',  badge: 'bg-amber-50 text-amber-700 border-amber-300'  },
};

const TEAM_CONFIG = {
  bpso:     { label: 'BPSO',              color: 'bg-blue-50 text-blue-700 border-blue-300'        },
  disaster: { label: 'Disaster Response', color: 'bg-orange-50 text-orange-700 border-orange-300'  },
  bhert:    { label: 'BHERT',             color: 'bg-green-50 text-green-700 border-green-300'     },
  general:  { label: 'General Response',  color: 'bg-slate-50 text-slate-600 border-slate-300'     },
};

// ─── Shared helpers ────────────────────────────────────────────────────────────
function EmergencyTypeBadge({ type }) {
  const cfg = EMERGENCY_TYPES[type] || EMERGENCY_TYPES.Medical;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${cfg.badge}`}>
      <Icon className="w-3 h-3" />{type || '—'}
    </span>
  );
}

function EmergencyIconBox({ type }) {
  const cfg = EMERGENCY_TYPES[type] || EMERGENCY_TYPES.Medical;
  const Icon = cfg.icon;
  return (
    <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
      <Icon className={`w-4 h-4 ${cfg.color}`} />
    </div>
  );
}

// ─── Responder Card ─────────────────────────────────────────────────────────────
// compact=true  → small strip for list cards
// compact=false → full section for modals
function ResponderCard({ responder, userRecord, compact = false }) {
  const hasData  = responder || userRecord;
  const name     = responder?.name || userRecord?.full_name || userRecord?.email || 'Unknown Responder';
  const team     = responder?.team;
  const email    = userRecord?.email;
  const phone    = userRecord?.phone;
  const status   = responder?.status;
  const teamCfg  = team ? TEAM_CONFIG[team] : null;
  const initial  = name.charAt(0).toUpperCase();

  if (!hasData) {
    return (
      <div className={`flex items-center gap-2.5 ${compact ? 'p-2.5' : 'p-3'} bg-slate-50 border border-dashed border-slate-300 rounded-lg`}>
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400 italic">No responder assigned</p>
      </div>
    );
  }

  // ── compact: one-line strip ──────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
          {teamCfg && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${teamCfg.color}`}>
              <ShieldCheck className="w-2.5 h-2.5" />{teamCfg.label}
            </span>
          )}
        </div>
        <Radio className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </div>
    );
  }

  // ── full card ────────────────────────────────────────────────────────────────
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-slate-500" />
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Responding Officer</p>
      </div>
      <div className="p-4">
        {/* Identity row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {initial}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            {teamCfg && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold mt-0.5 ${teamCfg.color}`}>
                <ShieldCheck className="w-3 h-3" />{teamCfg.label}
              </span>
            )}
          </div>
        </div>
        {/* Contact / status info */}
        <div className="space-y-1.5">
          {email && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-slate-900 transition-colors truncate">{email}</a>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-slate-900 transition-colors">{phone}</a>
            </div>
          )}
          {status && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Radio className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="capitalize font-medium">Field status: {status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────────────────────
function UploadEvidenceModal({ emergency, onClose, onSuccess }) {
  const [uploading, setUploading]       = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [notes, setNotes]               = useState('');
  const [error, setError]               = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('File size must be less than 5MB.'); return; }
    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a photo first.'); return; }
    setUploading(true); setError('');
    try {
      const ext      = selectedFile.name.split('.').pop();
      const filePath = `emergency-evidence/${emergency.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('evidence').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('emergencies').update({
        evidence_photo_url: publicUrl,
        responder_notes:    notes || null,
        completed_at:       new Date().toISOString(),
      }).eq('id', emergency.id);
      if (updateError) throw updateError;
      onSuccess(); onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload evidence.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upload Evidence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Emergency #{emergency.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Emergency summary */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center gap-3">
            <EmergencyIconBox type={emergency.type} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
              <p className="text-xs text-slate-500 truncate">{emergency.location_text}</p>
            </div>
            <EmergencyTypeBadge type={emergency.type} />
          </div>

          {/* Responder info */}
          <ResponderCard responder={emergency._responder} userRecord={emergency._user} compact />

          {/* File upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Evidence Photo *</label>
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600"><span className="text-slate-800">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG — max 5MB</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </label>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-44 object-cover rounded border border-slate-200" />
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <label className="absolute bottom-2 left-2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <Camera className="w-3.5 h-3.5" />Change Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Responder Notes <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Describe the situation on arrival, actions taken, outcome..."
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none" />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-bold mb-1">Photo Guidelines</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Clearly show the resolved situation</li>
                <li>Include visible landmarks or identifiers</li>
                <li>Ensure good lighting and clarity</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={onClose} disabled={uploading}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleUpload} disabled={!selectedFile || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {uploading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
              : <><Upload className="w-3.5 h-3.5" />Upload Evidence</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Evidence Modal ───────────────────────────────────────────────────────
function ViewEvidenceModal({ emergency, onClose, onDelete }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this evidence photo?')) return;
    setDeleting(true); setError('');
    try {
      const parts    = emergency.evidence_photo_url.split('/');
      const fileName = parts[parts.length - 1];
      await supabase.storage.from('evidence').remove([`emergency-evidence/${fileName}`]);
      await supabase.from('emergencies').update({ evidence_photo_url: null }).eq('id', emergency.id);
      onDelete(); onClose();
    } catch {
      setError('Failed to delete evidence.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Evidence Record</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {emergency.type} Emergency · #{emergency.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-300 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Emergency header */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center gap-3">
              <EmergencyIconBox type={emergency.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emergency.location_text || '—'}</span>
                  {emergency.completed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(emergency.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <EmergencyTypeBadge type={emergency.type} />
            </div>

            {/* ── Responding Officer full card ── */}
            <ResponderCard responder={emergency._responder} userRecord={emergency._user} compact={false} />

            {/* Incident details */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />Incident Record
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {[
                  { label: 'Reference ID',   value: `#${emergency.id.slice(0, 8).toUpperCase()}`, mono: true },
                  { label: 'Severity',       value: (emergency.severity || 'High').toUpperCase()           },
                  { label: 'Assigned Team',  value: emergency.assigned_team ? (TEAM_CONFIG[emergency.assigned_team]?.label || emergency.assigned_team) : '—' },
                  { label: 'Responder Status', value: emergency.responder_status || '—', capitalize: true  },
                  { label: 'Location',       value: emergency.location_text || '—', full: true             },
                  { label: 'Reported At',    value: new Date(emergency.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Arrived At',     value: emergency.arrived_at ? new Date(emergency.arrived_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                  { label: 'Completed At',   value: emergency.completed_at ? new Date(emergency.completed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                ].map(({ label, value, mono, capitalize, full }) => (
                  <div key={label} className={full ? 'col-span-2' : ''}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                    <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence photo */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" />Evidence Photo
                </p>
                <button onClick={() => setIsZoomed(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />Full Size
                </button>
              </div>
              <img src={emergency.evidence_photo_url} alt="Evidence"
                className="w-full h-72 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() => setIsZoomed(true)} />
            </div>

            {/* Responder notes */}
            {emergency.responder_notes && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5" />Field Notes
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{emergency.responder_notes}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
            <a href={emergency.evidence_photo_url} download
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors">
              <Download className="w-3.5 h-3.5" />Download
            </a>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 ml-auto">
              {deleting
                ? <><div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />Deleting...</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
            </button>
          </div>
        </div>
      </div>

      {isZoomed && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded transition-colors" onClick={() => setIsZoomed(false)}>
            <X className="w-6 h-6" />
          </button>
          <img src={emergency.evidence_photo_url} alt="Full View"
            className="max-w-full max-h-[90vh] object-contain rounded"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EmergencyEvidence() {
  const [emergencies,       setEmergencies]       = useState([]);
  const [filtered,          setFiltered]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [filterType,        setFilterType]        = useState('all');
  const [uploadModal,       setUploadModal]       = useState(false);
  const [viewModal,         setViewModal]         = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    fetchEmergencies();
    const ch = supabase.channel('em-evidence-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchEmergencies)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    let data = emergencies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(e =>
        e.type?.toLowerCase().includes(q) ||
        e.location_text?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e._responder?.name?.toLowerCase().includes(q) ||
        e._user?.email?.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') data = data.filter(e => e.type === filterType);
    setFiltered(data);
  }, [emergencies, searchQuery, filterType]);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      // 1 — Resolved emergencies
      const { data: emData, error: emErr } = await supabase
        .from('emergencies')
        .select('*')
        .eq('status', 'resolved')
        .order('completed_at', { ascending: false });
      if (emErr) throw emErr;
      if (!emData?.length) { setEmergencies([]); return; }

      // 2 — Unique responder IDs
      const respIds = [...new Set(emData.map(e => e.responder_id).filter(Boolean))];

      // 3 — Fetch responders (name, team, status)
      let respondersMap = {};
      if (respIds.length) {
        const { data: rData } = await supabase
          .from('responders')
          .select('id, name, team, status')
          .in('id', respIds);
        respondersMap = Object.fromEntries((rData || []).map(r => [r.id, r]));
      }

      // 4 — Fetch user records (email, full_name, phone)
      let usersMap = {};
      if (respIds.length) {
        const { data: uData } = await supabase
          .from('users')
          .select('id, email, full_name, phone')
          .in('id', respIds);
        usersMap = Object.fromEntries((uData || []).map(u => [u.id, u]));
      }

      // 5 — Merge onto emergencies
      const enriched = emData.map(em => ({
        ...em,
        _responder: em.responder_id ? (respondersMap[em.responder_id] || null) : null,
        _user:      em.responder_id ? (usersMap[em.responder_id]      || null) : null,
      }));

      setEmergencies(enriched);
    } catch (err) {
      console.error('fetchEmergencies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total:          emergencies.length,
    withEvidence:   emergencies.filter(e => e.evidence_photo_url).length,
    withoutEvidence:emergencies.filter(e => !e.evidence_photo_url).length,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Camera className="w-3.5 h-3.5" />Emergency Evidence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evidence Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Completion photos and responding officer records</p>
        </div>
        <button onClick={fetchEmergencies} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Resolved',   value: stats.total,           color: 'text-slate-700' },
          { label: 'With Evidence',    value: stats.withEvidence,    color: 'text-green-600' },
          { label: 'Missing Evidence', value: stats.withoutEvidence, color: 'text-red-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by type, location, ID or responder name / email..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 transition font-semibold">
            <option value="all">All Types</option>
            {Object.keys(EMERGENCY_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm text-center py-16">
          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center mx-auto mb-3">
            <FileImage className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No resolved emergencies found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emergency => (
            <div key={emergency.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

              {/* Image / Placeholder */}
              {emergency.evidence_photo_url ? (
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img src={emergency.evidence_photo_url} alt="Evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold bg-green-50 text-green-700 border-green-300">
                      <CheckCircle className="w-3 h-3" />Evidence
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-44 bg-slate-50 border-b border-slate-200 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">No Evidence Yet</p>
                </div>
              )}

              {/* Card body */}
              <div className="p-4 space-y-3">
                {/* Type + ID */}
                <div className="flex items-center gap-2.5">
                  <EmergencyIconBox type={emergency.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
                    <p className="text-xs text-slate-500 font-mono">#{emergency.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <EmergencyTypeBadge type={emergency.type} />
                </div>

                {/* Responder mini strip */}
                <ResponderCard responder={emergency._responder} userRecord={emergency._user} compact />

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{emergency.location_text || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {new Date(emergency.completed_at || emergency.created_at)
                        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2 border-t border-slate-100">
                  {emergency.evidence_photo_url ? (
                    <button onClick={() => { setSelectedEmergency(emergency); setViewModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors">
                      <Eye className="w-3.5 h-3.5" />View Evidence & Responder
                    </button>
                  ) : (
                    <button onClick={() => { setSelectedEmergency(emergency); setUploadModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors">
                      <Upload className="w-3.5 h-3.5" />Upload Evidence
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadModal && selectedEmergency && (
        <UploadEvidenceModal
          emergency={selectedEmergency}
          onClose={() => { setUploadModal(false); setSelectedEmergency(null); }}
          onSuccess={fetchEmergencies}
        />
      )}
      {viewModal && selectedEmergency && (
        <ViewEvidenceModal
          emergency={selectedEmergency}
          onClose={() => { setViewModal(false); setSelectedEmergency(null); }}
          onDelete={fetchEmergencies}
        />
      )}
    </div>
  );
}