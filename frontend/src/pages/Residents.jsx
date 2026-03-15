// src/pages/Residents.jsx
import { useState, useEffect } from 'react';
import {
  Search, Eye, X, ChevronLeft, ChevronRight, AlertTriangle,
  User, Download, RefreshCw, Phone, Mail, MapPin, Calendar,
  CheckCircle, Shield, Ban, Flag, Clock, Loader2, FileText,
  XCircle, ZoomIn, IdCard, ShieldOff,
} from 'lucide-react';
import { supabase } from '../config/supabase';
import UserActionModal from '../components/UserActionModal';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:           { classes: 'bg-green-50 text-green-700 border-green-300',    icon: CheckCircle, label: 'Active'           },
    flagged:          { classes: 'bg-amber-50 text-amber-700 border-amber-300',    icon: Flag,        label: 'Flagged'          },
    suspended:        { classes: 'bg-red-50 text-red-700 border-red-300',          icon: Ban,         label: 'Suspended'        },
    pending_approval: { classes: 'bg-purple-50 text-purple-700 border-purple-300', icon: Clock,       label: 'Pending Approval' },
    pending:          { classes: 'bg-purple-50 text-purple-700 border-purple-300', icon: Clock,       label: 'Pending'          },
  };
  const cfg  = map[status] || map.active;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${cfg.classes}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  if (!verified) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-300">
      Unverified
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-300">
      <Shield className="w-3 h-3" />Verified
    </span>
  );
}

function IDVerificationBadge({ status }) {
  const map = {
    unsubmitted: { classes: 'bg-slate-50 text-slate-500 border-slate-300',  label: 'No ID Submitted'   },
    pending:     { classes: 'bg-amber-50 text-amber-700 border-amber-300',  label: 'ID Pending Review' },
    approved:    { classes: 'bg-green-50 text-green-700 border-green-300',  label: 'ID Approved'       },
    rejected:    { classes: 'bg-red-50 text-red-700 border-red-300',        label: 'ID Rejected'       },
  };
  const cfg = map[status || 'unsubmitted'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wider ${cfg.classes}`}>
      <IdCard className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1">
          <X className="w-6 h-6" />
        </button>
        <img src={src} alt="ID" className="w-full rounded-lg shadow-2xl object-contain max-h-[80vh]" />
      </div>
    </div>
  );
}

// ─── Rejection Modal ──────────────────────────────────────────────────────────
function RejectionModal({ isOpen, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const presets = [
    'ID image is blurry or unreadable',
    'ID appears to be expired',
    'ID does not match registered information',
    'ID type is not accepted',
    'Photo on ID does not match profile',
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="bg-red-700 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <XCircle className="w-4 h-4" />Reject Registration
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Quick Reasons</p>
          <div className="space-y-2">
            {presets.map(p => (
              <button key={p} onClick={() => setReason(p)}
                className={`w-full text-left px-3 py-2 text-xs rounded border transition-all ${
                  reason === p ? 'bg-red-50 border-red-400 text-red-800 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                }`}>
                {p}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">Custom Reason</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="Enter rejection reason..." />
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Resident Modal ──────────────────────────────────────────────────────
function ViewResidentModal({ resident, onClose, onDone, onOpenUserAction }) {
  if (!resident) return null;

  const [loading,       setLoading]       = useState(false);
  const [lightboxSrc,   setLightboxSrc]   = useState(null);
  const [showRejection, setShowRejection] = useState(false);
  const [activeTab,     setActiveTab]     = useState('profile');

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const b = new Date(dob), t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
  };

  const accountAge         = Math.floor((new Date() - new Date(resident.created_at)) / 86400000);
  const verificationStatus = resident.verification_status || 'unsubmitted';
  const hasPendingID       = verificationStatus === 'pending';
  const isPendingApproval  = resident.account_status === 'pending_approval';
  const needsAction        = isPendingApproval || hasPendingID;

  // ── Approve ID + activate account simultaneously ──────────────────────────
  const approveAndActivate = async () => {
    if (!confirm('Approve this registration? The resident\'s ID will be verified and their account activated.')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          account_status:      'active',
          verification_status: 'approved',
          is_verified:         true,
          verified_at:         new Date().toISOString(),
          rejection_reason:    null,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', resident.id);
      if (error) throw error;
      onDone(true);
      onClose();
    } catch {
      alert('Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  // ── Reject: blocks account, records reason ────────────────────────────────
  const rejectRegistration = async (reason) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          account_status:      'suspended',
          verification_status: 'rejected',
          is_verified:         false,
          rejection_reason:    reason,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', resident.id);
      if (error) throw error;
      setShowRejection(false);
      onDone(true);
      onClose();
    } catch {
      alert('Failed to reject registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-200">

          {/* Header */}
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                {needsAction && (
                  <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded font-bold animate-pulse">
                    ACTION REQUIRED
                  </span>
                )}
                Resident Profile
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{resident.id?.slice(0, 8)}...</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 border-b border-slate-200 px-4 py-2">
            {[
              { id: 'profile', label: 'Profile Info',  icon: User   },
              { id: 'id',      label: 'ID & Approval', icon: IdCard, badge: needsAction ? '!' : null },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
                {badge && <span className="bg-amber-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold">{badge}</span>}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={resident.account_status || 'active'} />
                  <VerifiedBadge verified={resident.is_verified} />
                  <IDVerificationBadge status={verificationStatus} />
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                    <Calendar className="w-3.5 h-3.5" />Registered: {new Date(resident.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                    <Clock className="w-3.5 h-3.5" />{accountAge} days ago
                  </span>
                </div>

                {needsAction && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg p-3.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Approval Required</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Review the resident's submitted ID in the <strong>ID & Approval</strong> tab, then approve or reject their registration.
                      </p>
                    </div>
                    <button onClick={() => setActiveTab('id')}
                      className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded flex-shrink-0">
                      Review ID →
                    </button>
                  </div>
                )}

                {/* Admin action notes banner — shown when a flag/suspend/ban has been applied */}
                {resident.admin_action_notes && (
                  <div className="flex items-start gap-3 bg-slate-50 border border-slate-300 rounded-lg p-3.5">
                    <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Enforcement Note</p>
                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{resident.admin_action_notes}</p>
                    </div>
                  </div>
                )}

                {resident.account_status === 'suspended' && verificationStatus === 'rejected' && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Registration Rejected</p>
                      <p className="text-xs text-red-700 mt-0.5">Reason: {resident.rejection_reason || 'No reason provided'}</p>
                    </div>
                  </div>
                )}
                {resident.account_status === 'flagged' && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                    <Flag className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Account Flagged</p>
                      <p className="text-xs text-amber-700 mt-0.5">Review recent activity before taking action.</p>
                    </div>
                  </div>
                )}
                {resident.account_status === 'suspended' && verificationStatus !== 'rejected' && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5">
                    <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900 uppercase tracking-wide">
                        {resident.is_banned ? 'Account Permanently Banned' : 'Account Suspended'}
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {resident.is_banned
                          ? 'This account has been permanently banned and cannot be reinstated via the admin interface.'
                          : 'This user cannot access the app.'}
                      </p>
                      {resident.suspension_expires_at && !resident.is_banned && (
                        <p className="text-xs text-red-600 mt-1 font-semibold">
                          Suspension expires: {new Date(resident.suspension_expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Personal Info */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Personal Information</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date of Birth</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {resident.date_of_birth ? new Date(resident.date_of_birth).toLocaleDateString() : 'N/A'}
                      </p>
                      {resident.date_of_birth && (
                        <p className="text-xs text-slate-400 mt-0.5">{calculateAge(resident.date_of_birth)} years old</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gender</p>
                      <p className="text-sm font-semibold text-slate-900">{resident.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account Type</p>
                      <p className="text-sm font-semibold text-slate-900">{resident.account_type || 'resident'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Contact Information</p>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                      <a href={`mailto:${resident.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5" />{resident.email || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                      <a href={`tel:${resident.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5" />{resident.phone || 'N/A'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Address Information</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Address</p>
                      <p className="text-sm text-slate-800">{resident.address || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Purok</p>
                        <p className="text-sm font-semibold text-slate-900">{resident.purok || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Barangay</p>
                        <p className="text-sm font-semibold text-slate-900">{resident.barangay || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── ID & Approval Tab ── */}
            {activeTab === 'id' && (
              <div className="space-y-4">

                <div className={`rounded-lg p-4 border-2 flex items-start gap-3 ${
                  verificationStatus === 'pending'     ? 'bg-amber-50 border-amber-300' :
                  verificationStatus === 'approved'    ? 'bg-green-50 border-green-300' :
                  verificationStatus === 'rejected'    ? 'bg-red-50 border-red-300'     :
                  'bg-slate-50 border-slate-200'
                }`}>
                  {verificationStatus === 'pending'     && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                  {verificationStatus === 'approved'    && <CheckCircle   className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                  {verificationStatus === 'rejected'    && <XCircle       className="w-5 h-5 text-red-600   flex-shrink-0 mt-0.5" />}
                  {verificationStatus === 'unsubmitted' && <IdCard        className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      {verificationStatus === 'pending'     && 'ID Submitted — Awaiting Your Review'}
                      {verificationStatus === 'approved'    && 'Approved — Resident is Verified & Active'}
                      {verificationStatus === 'rejected'    && 'Registration Rejected'}
                      {verificationStatus === 'unsubmitted' && 'No ID Submitted Yet'}
                    </p>
                    {verificationStatus === 'approved' && resident.verified_at && (
                      <p className="text-xs text-green-700 mt-0.5">
                        Approved on {new Date(resident.verified_at).toLocaleString()}
                      </p>
                    )}
                    {verificationStatus === 'rejected' && resident.rejection_reason && (
                      <p className="text-xs text-red-700 mt-0.5">Reason: {resident.rejection_reason}</p>
                    )}
                  </div>
                </div>

                {resident.id_type && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />Submitted ID Type
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-900">{resident.id_type}</p>
                    </div>
                  </div>
                )}

                {(resident.id_front_url || resident.id_back_url) ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <IdCard className="w-3.5 h-3.5" />ID Photos
                      </p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {[
                        { label: 'Front Side', url: resident.id_front_url },
                        { label: 'Back Side',  url: resident.id_back_url  },
                      ].map(({ label, url }) => (
                        <div key={label}>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                          {url ? (
                            <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                              onClick={() => setLightboxSrc(url)}>
                              <img src={url} alt={label} className="w-full h-36 object-cover group-hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-36 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                              <p className="text-xs text-slate-400">Not provided</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                    <IdCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">No ID images uploaded</p>
                  </div>
                )}

                {hasPendingID && (
                  <div className="border border-amber-200 rounded-lg overflow-hidden">
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Review Checklist</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {[
                        'Name on ID matches registered full name',
                        'ID photo is clear and unobstructed',
                        'ID is not expired',
                        'ID is a valid government-issued document',
                        'Face photo on ID is visible',
                      ].map((item, i) => (
                        <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" className="w-3.5 h-3.5 accent-slate-700" />
                          <span className="text-xs text-slate-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-2 flex-wrap">
            <button onClick={onClose} disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50">
              Close
            </button>

            {/* ── NEW REGISTRATION: approve/reject on ID tab ── */}
            {activeTab === 'id' && needsAction && (
              <>
                <button onClick={() => setShowRejection(true)} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" />Reject Registration
                </button>
                <button onClick={approveAndActivate} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-green-700 hover:bg-green-800 text-white rounded disabled:opacity-50">
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve ID & Activate Account
                </button>
              </>
            )}

            {/* ── EXISTING ACTIVE RESIDENTS: use UserActionModal for flag/suspend/ban ── */}
            {activeTab === 'profile' && !needsAction && (
              <>
                {/* Restore — simple direct update, no modal needed */}
                {(resident.account_status === 'suspended' || resident.account_status === 'flagged') && !resident.is_banned && (
                  <button
                    onClick={async () => {
                      if (!confirm('Restore this account to active status?')) return;
                      setLoading(true);
                      try {
                        const { error } = await supabase
                          .from('users')
                          .update({
                            account_status:        'active',
                            suspension_expires_at: null,
                            admin_action_notes:    null,
                            updated_at:            new Date().toISOString(),
                          })
                          .eq('id', resident.id);
                        if (error) throw error;
                        onDone(false);
                        onClose();
                      } catch {
                        alert('Failed to restore account');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Restore Account
                  </button>
                )}

                {/* Flag / Suspend / Ban — opens UserActionModal */}
                {!resident.is_banned && resident.account_status !== 'suspended' && (
                  <button
                    onClick={() => onOpenUserAction(resident)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded disabled:opacity-50"
                  >
                    <Flag className="w-3.5 h-3.5" /> Flag / Suspend / Ban
                  </button>
                )}

                {/* Direct suspend option when already flagged */}
                {resident.account_status === 'flagged' && (
                  <button
                    onClick={() => onOpenUserAction(resident)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Escalate Action
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <RejectionModal
        isOpen={showRejection}
        onClose={() => setShowRejection(false)}
        onConfirm={rejectRegistration}
        loading={loading}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Residents() {
  const [residents,        setResidents]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);
  const [viewModalOpen,    setViewModalOpen]    = useState(false);
  const [userActionTarget, setUserActionTarget] = useState(null); // ← NEW
  const [searchTerm,       setSearchTerm]       = useState('');
  const [purokFilter,      setPurokFilter]      = useState('All');
  const [statusFilter,     setStatusFilter]     = useState('All');
  const [verifFilter,      setVerifFilter]      = useState('All');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [totalCount,       setTotalCount]       = useState(0);
  const [stats, setStats] = useState({
    total: 0, active: 0, flagged: 0, verified: 0, pendingID: 0, pendingApproval: 0,
  });

  const itemsPerPage = 10;

  const fetchResidents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('account_type', 'resident')
        .order('created_at', { ascending: false });

      if (searchTerm)             query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      if (purokFilter  !== 'All') query = query.eq('purok', purokFilter);
      if (statusFilter !== 'All') query = query.eq('account_status', statusFilter);
      if (verifFilter  !== 'All') query = query.eq('verification_status', verifFilter);

      const from = (currentPage - 1) * itemsPerPage;
      query = query.range(from, from + itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setResidents(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / itemsPerPage)));
    } catch (err) {
      console.error('fetchResidents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('account_status, is_verified, verification_status')
        .eq('account_type', 'resident');
      if (error) throw error;
      if (data) {
        setStats({
          total:           data.length,
          active:          data.filter(r => r.account_status === 'active').length,
          flagged:         data.filter(r => r.account_status === 'flagged').length,
          verified:        data.filter(r => r.is_verified).length,
          pendingID:       data.filter(r => r.verification_status === 'pending').length,
          pendingApproval: data.filter(r => r.account_status === 'pending_approval').length,
        });
      }
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  };

  useEffect(() => { fetchResidents(); }, [searchTerm, purokFilter, statusFilter, verifFilter, currentPage]);
  useEffect(() => { fetchStats(); }, [residents]);

  const handleDone = (resetFilters) => {
    if (resetFilters) {
      setStatusFilter('All');
      setVerifFilter('All');
      setCurrentPage(1);
    }
    fetchResidents();
    fetchStats();
  };

  // Opens UserActionModal from ViewResidentModal or from the table directly
  const handleOpenUserAction = (resident) => {
    setUserActionTarget(resident);
    // If called from inside ViewResidentModal, close that first
    setViewModalOpen(false);
    setSelectedResident(null);
  };

  const handleUserActionSuccess = () => {
    fetchResidents();
    fetchStats();
  };

  const clearFilters = () => {
    setSearchTerm(''); setPurokFilter('All');
    setStatusFilter('All'); setVerifFilter('All');
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['ID','Name','Email','Phone','Address','Purok','Status','Verified','ID Status','Registered'];
    const rows = residents.map(r => [
      r.id, r.full_name || '', r.email, r.phone || '', r.address || '',
      r.purok || '', r.account_status || 'active',
      r.is_verified ? 'Yes' : 'No',
      r.verification_status || 'unsubmitted',
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv  = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <User className="w-3.5 h-3.5" />Residents
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Residents Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Approve new registrations and manage resident accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchResidents(); fetchStats(); }} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button onClick={exportToCSV} disabled={residents.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded shadow-sm disabled:opacity-50">
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total',            value: stats.total,           color: 'text-slate-700', highlight: false },
          { label: 'Active',           value: stats.active,          color: 'text-green-600', highlight: false },
          { label: 'Flagged',          value: stats.flagged,         color: stats.flagged > 0          ? 'text-amber-600'  : 'text-slate-400', highlight: stats.flagged > 0 },
          { label: 'Verified',         value: stats.verified,        color: 'text-blue-600',  highlight: false },
          { label: 'Pending Approval', value: stats.pendingApproval, color: stats.pendingApproval > 0  ? 'text-purple-600' : 'text-slate-400', highlight: stats.pendingApproval > 0 },
          { label: 'Pending ID',       value: stats.pendingID,       color: stats.pendingID > 0        ? 'text-amber-600'  : 'text-slate-400', highlight: stats.pendingID > 0 },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className={`bg-white border rounded-lg p-4 shadow-sm ${highlight ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Action Banners */}
      {stats.pendingApproval > 0 && (
        <div className="bg-purple-50 border border-purple-300 rounded-lg px-5 py-3.5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-purple-900 flex-1">
            {stats.pendingApproval} new registration{stats.pendingApproval > 1 ? 's are' : ' is'} waiting for your review.
          </p>
          <button onClick={() => { setStatusFilter('pending_approval'); setCurrentPage(1); }}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded">
            Review Now
          </button>
        </div>
      )}
      {stats.pendingID > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-900 flex-1">
            {stats.pendingID} resident{stats.pendingID > 1 ? 's have' : ' has'} submitted ID awaiting verification.
          </p>
          <button onClick={() => { setVerifFilter('pending'); setCurrentPage(1); }}
            className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded">
            View Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Filters</p>
          {(searchTerm || purokFilter !== 'All' || statusFilter !== 'All' || verifFilter !== 'All') && (
            <span className="ml-auto text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Active</span>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or email..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <select value={purokFilter} onChange={e => { setPurokFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Purok</option>
            {['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="flagged">Flagged</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={verifFilter} onChange={e => { setVerifFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
            <option value="All">All ID Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="unsubmitted">Not Submitted</option>
          </select>
          <button onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">
            <RefreshCw className="w-4 h-4" />Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5" />Registered Residents
          </p>
          <span className="text-xs text-slate-400">{totalCount.toLocaleString()} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No residents found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            {(searchTerm || purokFilter !== 'All' || statusFilter !== 'All' || verifFilter !== 'All') && (
              <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    {['Name','Contact','Address','Registered','Status','ID Status',''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residents.map(resident => {
                    const fullName     = resident.full_name || `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'Unknown';
                    const initials     = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const isPendingAcc = resident.account_status === 'pending_approval';
                    const isPendingID  = resident.verification_status === 'pending';
                    const needsAction  = isPendingAcc || isPendingID;

                    return (
                      <tr key={resident.id} className={`transition-colors ${
                        isPendingAcc ? 'bg-purple-50/40 hover:bg-purple-50' :
                        isPendingID  ? 'bg-amber-50/40 hover:bg-amber-50'   :
                        'hover:bg-slate-50'
                      }`}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                              isPendingAcc ? 'bg-purple-600' : isPendingID ? 'bg-amber-600' : 'bg-slate-700'
                            }`}>{initials}</div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                              <p className="text-xs text-slate-400">{resident.gender || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-800 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />{resident.email}
                          </p>
                          {resident.phone && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                              <Phone className="w-3 h-3" />{resident.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-start gap-1 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{resident.address || 'N/A'}</span>
                          </div>
                          {resident.purok && <p className="text-xs text-slate-400 mt-0.5 ml-5">{resident.purok}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(resident.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <StatusBadge status={resident.account_status || 'active'} />
                            <VerifiedBadge verified={resident.is_verified} />
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <IDVerificationBadge status={resident.verification_status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setSelectedResident(resident); setViewModalOpen(true); }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${
                                needsAction
                                  ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                              }`}>
                              <Eye className="w-3.5 h-3.5" />
                              {needsAction ? 'Review' : 'View'}
                            </button>
                            {/* Quick flag button directly in table — only for active/flagged residents */}
                            {!needsAction && resident.account_status !== 'suspended' && (
                              <button
                                onClick={() => handleOpenUserAction(resident)}
                                className="p-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                                title="Flag / Suspend / Ban"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
                {' '}–{' '}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                {' '}of <span className="font-semibold text-slate-900">{totalCount}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold">
                  {currentPage} <span className="opacity-60">/ {totalPages}</span>
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {viewModalOpen && (
        <ViewResidentModal
          resident={selectedResident}
          onClose={() => { setViewModalOpen(false); setSelectedResident(null); }}
          onDone={handleDone}
          onOpenUserAction={handleOpenUserAction}
        />
      )}

      {/* UserActionModal — shown when opened from table OR from ViewResidentModal */}
      {userActionTarget && (
        <UserActionModal
          user={userActionTarget}
          onClose={() => setUserActionTarget(null)}
          onSuccess={handleUserActionSuccess}
        />
      )}
    </div>
  );
}