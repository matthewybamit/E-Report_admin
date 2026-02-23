// src/pages/Emergency.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import CallModal from '../components/CallModal';
import {
  AlertTriangle, Phone, MapPin, Clock, X, CheckCircle,
  Navigation, Ambulance, Flame, Shield, Zap, MessageSquare,
  Eye, RefreshCw, Filter, ArrowRight, FileText, Radio,
  Users, Activity
} from 'lucide-react';

// ─── Emergency Type Icon ──────────────────────────────────────────────────────
function EmergencyIcon({ type, small = false }) {
  const icons = {
    Medical:  { icon: Ambulance,     color: 'text-red-600',    bg: 'bg-red-50    border-red-200'    },
    Fire:     { icon: Flame,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    Crime:    { icon: Shield,        color: 'text-slate-600',  bg: 'bg-slate-50  border-slate-200'  },
    Accident: { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200'  },
  };
  const { icon: Icon, color, bg } = icons[type] || icons.Medical;
  return (
    <div className={`flex-shrink-0 border rounded flex items-center justify-center ${bg} ${small ? 'w-8 h-8' : 'w-10 h-10'}`}>
      <Icon className={`${color} ${small ? 'w-4 h-4' : 'w-5 h-5'}`} />
    </div>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-400',
    urgent:   'bg-red-50 text-red-700 border-red-300',
    high:     'bg-orange-50 text-orange-700 border-orange-300',
    medium:   'bg-amber-50 text-amber-700 border-amber-300',
    low:      'bg-slate-50 text-slate-600 border-slate-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wide ${styles[severity] || styles.medium}`}>
      {(severity === 'critical' || severity === 'urgent') && <Zap className="w-3 h-3" />}
      {severity}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    pending:    'bg-red-50 text-red-700 border-red-300',
    dispatched: 'bg-blue-50 text-blue-700 border-blue-300',
    resolved:   'bg-green-50 text-green-700 border-green-300',
  };
  const dots = {
    pending:    'bg-red-500',
    dispatched: 'bg-blue-500',
    resolved:   'bg-green-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize tracking-wide ${styles[status] || styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[status] || dots.pending}`}></span>
      {status}
    </span>
  );
}

// ─── Dispatch Modal ───────────────────────────────────────────────────────────
function DispatchModal({ isOpen, onClose, onDispatch, responders }) {
  if (!isOpen) return null;
  const available = responders.filter(r => r.status === 'available');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200">
        <div className="bg-slate-800 px-5 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-4 h-4" />Select Response Unit
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{available.length} unit{available.length !== 1 ? 's' : ''} available</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {available.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No available units</p>
              <p className="text-xs text-slate-400 mt-1">All responders are currently deployed</p>
            </div>
          ) : available.map(r => (
            <button
              key={r.id}
              onClick={() => onDispatch(r.id)}
              className="w-full flex items-center justify-between p-3.5 border-2 border-slate-200 hover:border-slate-400 rounded bg-white hover:bg-slate-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <EmergencyIcon type={r.type} small />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.type} Unit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-50 text-green-700 border border-green-300 px-2 py-0.5 rounded font-semibold">Available</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Emergency Detail Modal ───────────────────────────────────────────────────
function EmergencyDetailModal({ emergency, onClose, onOpenDispatch, onResolve, onCallUser }) {
  if (!emergency) return null;

  const timeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">

        {/* Header */}
        <div className="sticky top-0 bg-slate-800 px-6 py-4 z-10 rounded-t-lg flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                REF: {emergency.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{emergency.type} Emergency</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SeverityBadge severity={emergency.severity || 'high'} />
              <StatusBadge status={emergency.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded border border-slate-600">
                <Clock className="w-3 h-3" />{timeAgo(emergency.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Emergency Type */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />Incident Classification
              </p>
            </div>
            <div className="p-4 flex items-center gap-3">
              <EmergencyIcon type={emergency.type} />
              <div>
                <p className="text-sm font-bold text-slate-900">{emergency.type} Emergency</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reported {new Date(emergency.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />Incident Description
              </p>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{emergency.description}</p>
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Location Information
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                {emergency.location_text || 'GPS Coordinates Provided'}
              </p>
              {emergency.latitude && emergency.longitude && (
                <p className="text-xs text-slate-500 font-mono">
                  {emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />Open in Maps
                </a>
                <button
                  onClick={() => onCallUser(emergency)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />Call Reporter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          {emergency.status === 'pending' && (
            <button
              onClick={() => onOpenDispatch(emergency)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors"
            >
              <Radio className="w-4 h-4" />Dispatch Response Unit
            </button>
          )}
          {emergency.status === 'dispatched' && (
            <button
              onClick={() => onResolve(emergency.id, emergency.responder_id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded transition-colors"
            >
              <CheckCircle className="w-4 h-4" />Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Emergency() {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [emergencyToDispatch, setEmergencyToDispatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-emergency-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEmergencies(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setEmergencies(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
        }
      })
      .subscribe();
    return () => channel.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: emData } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
      const { data: resData } = await supabase.from('responders').select('*');
      if (emData) setEmergencies(emData);
      if (resData) setResponders(resData);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (emergency) => {
    await supabase.from('emergencies').update({ call_status: 'calling' }).eq('id', emergency.id);
    setActiveCallId(emergency.id);
    setIsCallOpen(true);
    setSelectedEmergency(null);
  };

  const openDispatchModal = (emergency) => {
    setEmergencyToDispatch(emergency);
    setIsDispatchOpen(true);
  };

  const handleDispatch = async (responderId) => {
    if (!emergencyToDispatch) return;
    try {
      await supabase.from('emergencies')
        .update({ status: 'dispatched', responder_id: responderId })
        .eq('id', emergencyToDispatch.id);
      await supabase.from('responders')
        .update({ status: 'busy' })
        .eq('id', responderId);
      setIsDispatchOpen(false);
      setSelectedEmergency(null);
      fetchData();
      alert('Unit dispatched successfully.');
    } catch (error) {
      console.error(error);
      alert('Dispatch failed. Please try again.');
    }
  };

  const handleResolve = async (emergencyId, responderId) => {
    if (confirm('Confirm resolution of this emergency?')) {
      await supabase.from('emergencies').update({ status: 'resolved' }).eq('id', emergencyId);
      if (responderId) {
        await supabase.from('responders').update({ status: 'available' }).eq('id', responderId);
      }
      setSelectedEmergency(null);
      fetchData();
    }
  };

  const filteredEmergencies = emergencies.filter(e =>
    filterStatus === 'All' ? true : e.status === filterStatus
  );

  const stats = {
    total:      emergencies.length,
    pending:    emergencies.filter(e => e.status === 'pending').length,
    dispatched: emergencies.filter(e => e.status === 'dispatched').length,
    resolved:   emergencies.filter(e => e.status === 'resolved').length,
  };

  const borderColor = {
    pending:    'border-l-red-500',
    dispatched: 'border-l-blue-500',
    resolved:   'border-l-green-500',
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />Emergency Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor and dispatch responses to active emergency alerts in real time
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Incidents', value: stats.total,      icon: FileText,      color: 'text-slate-700'  },
          { label: 'Pending',         value: stats.pending,    icon: AlertTriangle, color: 'text-red-600'    },
          { label: 'Dispatched',      value: stats.dispatched, icon: Radio,         color: 'text-blue-600'   },
          { label: 'Resolved',        value: stats.resolved,   icon: CheckCircle,   color: 'text-green-600'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Disposition Status
          </label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            Showing <strong className="text-slate-600">{filteredEmergencies.length}</strong> of{' '}
            <strong className="text-slate-600">{emergencies.length}</strong> incidents
          </span>
        </div>
      </div>

      {/* ── Emergency List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading emergency records...</span>
        </div>
      ) : filteredEmergencies.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No emergency records found</p>
          <p className="text-sm text-slate-400 mt-1">Adjust your filter or check back later</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmergencies.map(emergency => (
            <div
              key={emergency.id}
              className={`bg-white border border-slate-200 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all ${borderColor[emergency.status] || 'border-l-slate-300'}`}
            >
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <EmergencyIcon type={emergency.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{emergency.type} Emergency</h3>
                      <StatusBadge status={emergency.status} />
                      {emergency.severity && <SeverityBadge severity={emergency.severity} />}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                      {emergency.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {emergency.location_text || 'GPS Location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(emergency.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="font-mono text-slate-300">
                        {emergency.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedEmergency(emergency)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />View
                  </button>
                  {emergency.status === 'pending' && (
                    <button
                      onClick={() => openDispatchModal(emergency)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5" />Dispatch
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <EmergencyDetailModal
        emergency={selectedEmergency}
        onClose={() => setSelectedEmergency(null)}
        onOpenDispatch={() => {
          openDispatchModal(selectedEmergency);
          setSelectedEmergency(null);
        }}
        onResolve={handleResolve}
        onCallUser={handleStartCall}
      />

      <DispatchModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onDispatch={handleDispatch}
        responders={responders}
      />

      <CallModal
        isOpen={isCallOpen}
        emergencyId={activeCallId}
        onClose={() => { setIsCallOpen(false); setActiveCallId(null); }}
      />
    </div>
  );
}
