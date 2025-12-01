// src/pages/Emergency.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import CallModal from '../components/CallModal'; // <--- IMPORTED HERE
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  User,
  X,
  CheckCircle,
  Navigation,
  Ambulance,
  Flame,
  Shield,
  Zap,
  MessageSquare,
  Eye,
  RefreshCw,
  Filter,
  ArrowRight
} from 'lucide-react';

// --- ICONS HELPER ---
function EmergencyIcon({ type }) {
  const icons = {
    Medical: { icon: Ambulance, color: 'text-red-600', bg: 'bg-red-100' },
    Fire: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' },
    Crime: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
    Accident: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  };
  const { icon: Icon, color, bg } = icons[type] || icons.Medical;
  return (
    <div className={`p-3 rounded-xl ${bg}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  );
}

// --- BADGES ---
function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50',
    urgent: 'bg-red-600 text-white shadow-md',
    high: 'bg-orange-500 text-white shadow-sm',
    medium: 'bg-yellow-500 text-white shadow-sm',
    low: 'bg-blue-500 text-white shadow-sm',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[severity] || styles.medium}`}>
      {severity === 'critical' && <Zap className="w-3 h-3 mr-1" />}
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-red-100 text-red-800 border-red-200',
    dispatched: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending} capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'pending' ? 'bg-red-500 animate-pulse' : status === 'dispatched' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
      {status}
    </span>
  );
}

// --- DISPATCH MODAL ---
function DispatchModal({ isOpen, onClose, onDispatch, responders }) {
  if (!isOpen) return null;

  const availableResponders = responders.filter(r => r.status === 'available');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Select Response Unit</h2>
        {availableResponders.length === 0 ? (
          <p className="text-red-500 text-center py-4">No available units!</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableResponders.map(responder => (
              <button
                key={responder.id}
                onClick={() => onDispatch(responder.id)}
                className="w-full flex items-center justify-between p-3 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${responder.type === 'Medical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {responder.type === 'Medical' ? <Ambulance size={18} /> : <Shield size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{responder.name}</p>
                    <p className="text-xs text-gray-500">{responder.type} Unit</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}
        <button onClick={onClose} className="w-full mt-4 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl">
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- EMERGENCY DETAIL MODAL ---
function EmergencyDetailModal({ emergency, onClose, onOpenDispatch, onResolve, onCallUser }) {
  if (!emergency) return null;

  const timeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Emergency Alert</h2>
              <p className="text-red-100 text-sm mt-0.5">ID: {emergency.id.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Severity */}
          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={emergency.severity || 'high'} />
            <StatusBadge status={emergency.status} />
            <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              {timeAgo(emergency.created_at)}
            </div>
          </div>

          {/* Emergency Type */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-4">
              <EmergencyIcon type={emergency.type} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Emergency Type</p>
                <p className="text-lg font-bold text-gray-900">{emergency.type} Emergency</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-green-600" /> Location
            </h3>
            <p className="text-sm font-medium text-gray-900 mb-3">{emergency.location_text || "GPS Coordinates Provided"}</p>
            
            <div className="flex gap-3">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Map</span>
              </a>
              
              {/* CALL BUTTON ADDED HERE */}
              <button 
                onClick={() => onCallUser(emergency)}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call User</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-gray-600" /> Description
            </h3>
            <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
              {emergency.description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
          {emergency.status === 'pending' && (
            <button 
              onClick={() => onOpenDispatch(emergency)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Dispatch Response Team</span>
            </button>
          )}
          {emergency.status === 'dispatched' && (
            <button 
              onClick={() => onResolve(emergency.id, emergency.responder_id)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </button>
          )}
          <button onClick={onClose} className="px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function Emergency() {
  const [emergencies, setEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [emergencyToDispatch, setEmergencyToDispatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // --- CALL STATE ---
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState(null);

  // 1. Fetch Data & Subscribe
  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('admin-emergency-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, 
        (payload) => {
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
    const { data: emData } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
    const { data: resData } = await supabase.from('responders').select('*');
    if (emData) setEmergencies(emData);
    if (resData) setResponders(resData);
  };

  // 2. Call Logic
  const handleStartCall = async (emergency) => {
      // Signal DB call is starting
      await supabase.from('emergencies').update({ call_status: 'calling' }).eq('id', emergency.id);
      setActiveCallId(emergency.id);
      setIsCallOpen(true);
      setSelectedEmergency(null); // Close details to show call modal cleanly
  };

  // 3. Dispatch Logic
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
      alert("Unit Dispatched Successfully!");
    } catch (error) {
      console.error(error);
      alert("Dispatch failed.");
    }
  };

  // 4. Resolve Logic
  const handleResolve = async (emergencyId, responderId) => {
    if (confirm("Are you sure you want to resolve this emergency?")) {
      await supabase.from('emergencies').update({ status: 'resolved' }).eq('id', emergencyId);
      if (responderId) {
        await supabase.from('responders').update({ status: 'available' }).eq('id', responderId);
      }
      setSelectedEmergency(null);
      fetchData();
    }
  };

  // Filter Logic
  const filteredEmergencies = emergencies.filter(e => {
    if (filterStatus === 'All') return true;
    return e.status === filterStatus;
  });

  const activeCount = emergencies.filter(e => e.status === 'pending').length;
  const respondingCount = emergencies.filter(e => e.status === 'dispatched').length;

  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            Emergency Management
          </h1>
          <p className="text-gray-600 mt-1 font-medium">Monitor incoming alerts live</p>
        </div>
        <button onClick={fetchData} className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold shadow-sm">
          <RefreshCw className="w-4 h-4" /> <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 uppercase">Pending</p>
              <p className="text-4xl font-bold text-red-700 mt-2">{activeCount}</p>
            </div>
            <div className="bg-red-200 p-4 rounded-xl"><AlertTriangle className="text-red-700"/></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase">Dispatched</p>
              <p className="text-4xl font-bold text-blue-700 mt-2">{respondingCount}</p>
            </div>
            <div className="bg-blue-200 p-4 rounded-xl"><Ambulance className="text-blue-700"/></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="font-semibold text-gray-700">Filter:</span>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Status</option>
          <option value="pending">Pending</option>
          <option value="dispatched">Dispatched</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredEmergencies.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No emergencies found.</div>
        ) : (
          filteredEmergencies.map(emergency => (
            <div key={emergency.id} className={`bg-white rounded-xl border-l-4 shadow-sm p-6 flex justify-between items-start hover:shadow-md transition-shadow ${
              emergency.status === 'pending' ? 'border-l-red-500' : emergency.status === 'dispatched' ? 'border-l-blue-500' : 'border-l-green-500'
            }`}>
              <div className="flex gap-4">
                <EmergencyIcon type={emergency.type} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{emergency.type} Emergency</h3>
                    <StatusBadge status={emergency.status} />
                  </div>
                  <p className="text-gray-600 mb-2">{emergency.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {emergency.location_text || 'GPS Location'}</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(emergency.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setSelectedEmergency(emergency)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2"/> View
                </button>
                
                {emergency.status === 'pending' && (
                  <button 
                    onClick={() => openDispatchModal(emergency)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2"/> Dispatch
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <EmergencyDetailModal 
        emergency={selectedEmergency} 
        onClose={() => setSelectedEmergency(null)} 
        onOpenDispatch={() => {
          openDispatchModal(selectedEmergency);
          setSelectedEmergency(null);
        }}
        onResolve={handleResolve}
        onCallUser={handleStartCall} // <--- Pass call handler
      />

      <DispatchModal 
        isOpen={isDispatchOpen} 
        onClose={() => setIsDispatchOpen(false)}
        onDispatch={handleDispatch}
        responders={responders}
      />

      {/* CALL MODAL */}
      <CallModal 
        isOpen={isCallOpen} 
        emergencyId={activeCallId}
        onClose={() => {
            setIsCallOpen(false);
            setActiveCallId(null);
        }} 
      />
    </div>
  );
}
