// src/pages/EmergencyEvidence.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Camera, Upload, Eye, X, CheckCircle, AlertCircle,
  Image as ImageIcon, MapPin, Clock, Download, Trash2,
  RefreshCw, Search, Maximize2, AlertTriangle, Shield,
  Heart, Flame, FileImage,
} from 'lucide-react';

// ─── Emergency type config ────────────────────────────────────────────────────
const EMERGENCY_TYPES = {
  Medical:  { icon: Heart,          color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-300',    badge: 'bg-red-50 text-red-700 border-red-300'    },
  Fire:     { icon: Flame,          color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-50 text-orange-700 border-orange-300' },
  Crime:    { icon: Shield,         color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300', badge: 'bg-purple-50 text-purple-700 border-purple-300' },
  Accident: { icon: AlertTriangle,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-300',  badge: 'bg-amber-50 text-amber-700 border-amber-300'  },
};

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

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadEvidenceModal({ emergency, onClose, onSuccess }) {
  const [uploading, setUploading]     = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [notes, setNotes]             = useState('');
  const [error, setError]             = useState('');

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
    setUploading(true);
    setError('');
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `emergency-evidence/${emergency.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('emergencies').update({
        evidence_photo_url: publicUrl,
        responder_notes: notes || null,
        completed_at: new Date().toISOString(),
      }).eq('id', emergency.id);
      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload evidence.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Upload Evidence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Emergency #{emergency.id.slice(0, 8)}</p>
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

          {/* Emergency Info */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center gap-3">
            <EmergencyIconBox type={emergency.type} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
              <p className="text-xs text-slate-500 truncate">{emergency.location_text}</p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">
              Evidence Photo *
            </label>
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  <span className="text-slate-800">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG — max 5MB</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
              </label>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded border border-slate-200" />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
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
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add completion notes or observations..."
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"
            />
          </div>

          {/* Info */}
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

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={onClose} disabled={uploading}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleUpload} disabled={!selectedFile || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {uploading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
              : <><Upload className="w-3.5 h-3.5" />Upload Evidence</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Evidence Modal ──────────────────────────────────────────────────────
function ViewEvidenceModal({ emergency, onClose, onDelete }) {
  const [isZoomed, setIsZoomed]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState('');

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this evidence photo?')) return;
    setDeleting(true);
    setError('');
    try {
      const urlParts = emergency.evidence_photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from('evidence').remove([`emergency-evidence/${fileName}`]);
      await supabase.from('emergencies').update({ evidence_photo_url: null }).eq('id', emergency.id);
      onDelete();
      onClose();
    } catch (err) {
      setError('Failed to delete evidence.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Evidence Photo</h2>
              <p className="text-xs text-slate-400 mt-0.5">Emergency #{emergency.id.slice(0, 8)}</p>
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

            {/* Emergency Info */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center gap-3">
              <EmergencyIconBox type={emergency.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emergency.location_text}</span>
                  {emergency.completed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(emergency.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Evidence Photo</label>
                <button onClick={() => setIsZoomed(true)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-semibold transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />Full Size
                </button>
              </div>
              <img
                src={emergency.evidence_photo_url}
                alt="Evidence"
                className="w-full h-72 object-cover rounded border border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                onClick={() => setIsZoomed(true)}
              />
            </div>

            {/* Responder Notes */}
            {emergency.responder_notes && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Responder Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{emergency.responder_notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Close
            </button>
            <a href={emergency.evidence_photo_url} download
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors">
              <Download className="w-3.5 h-3.5" />Download
            </a>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 ml-auto">
              {deleting
                ? <><div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />Deleting...</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Zoom overlay */}
      {isZoomed && (
        <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded transition-colors" onClick={() => setIsZoomed(false)}>
            <X className="w-6 h-6" />
          </button>
          <img src={emergency.evidence_photo_url} alt="Full View" className="max-w-full max-h-[90vh] object-contain rounded" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmergencyEvidence() {
  const [emergencies, setEmergencies]             = useState([]);
  const [filtered, setFiltered]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [searchQuery, setSearchQuery]             = useState('');
  const [filterType, setFilterType]               = useState('all');
  const [uploadModal, setUploadModal]             = useState(false);
  const [viewModal, setViewModal]                 = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    fetchEmergencies();
    const channel = supabase
      .channel('evidence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchEmergencies)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    let data = emergencies;
    if (searchQuery) data = data.filter(e =>
      e.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterType !== 'all') data = data.filter(e => e.type === filterType);
    setFiltered(data);
  }, [emergencies, searchQuery, filterType]);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergencies').select('*').eq('status', 'resolved')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      setEmergencies(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const stats = {
    total:       emergencies.length,
    withEvidence:    emergencies.filter(e => e.evidence_photo_url).length,
    withoutEvidence: emergencies.filter(e => !e.evidence_photo_url).length,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Camera className="w-3.5 h-3.5" />Emergency Evidence
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evidence Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload and manage emergency completion photos</p>
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
            <input
              type="text"
              placeholder="Search by type, location or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 transition font-semibold"
          >
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
            <div key={emergency.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

              {/* Image / Placeholder */}
              {emergency.evidence_photo_url ? (
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={emergency.evidence_photo_url}
                    alt="Evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <EmergencyIconBox type={emergency.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{emergency.type} Emergency</p>
                    <p className="text-xs text-slate-500">#{emergency.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{emergency.location_text || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{new Date(emergency.completed_at || emergency.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100">
                  {emergency.evidence_photo_url ? (
                    <button
                      onClick={() => { setSelectedEmergency(emergency); setViewModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />View Evidence
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelectedEmergency(emergency); setUploadModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                    >
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
