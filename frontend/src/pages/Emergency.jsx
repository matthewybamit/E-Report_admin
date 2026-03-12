// src/pages/Emergency.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import CallModal from '../components/CallModal';
import {
  AlertTriangle, Phone, MapPin, Clock, X, CheckCircle,
  Navigation, Ambulance, Flame, Shield, Zap, MessageSquare,
  Eye, RefreshCw, Filter, ArrowRight, FileText, Radio,
  Users, BanIcon, Send, Bot, Loader,
} from 'lucide-react';

// ─── Team Definitions ─────────────────────────────────────────────────────────
const RESPONSE_TEAMS = [  
  { value: 'bpso',     label: 'BPSO Team',             description: 'Barangay Public Safety Officers',        header: 'bg-blue-700',   color: 'bg-blue-50 text-blue-700 border-blue-300'     },
  { value: 'disaster', label: 'Disaster Response Team', description: 'Emergency disaster operations',           header: 'bg-orange-700', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'bhert',    label: 'BHERT',                  description: 'Barangay Health Emergency Response Team', header: 'bg-green-700',  color: 'bg-green-50 text-green-700 border-green-300'   },
  { value: 'general',  label: 'General Response',       description: 'Multi-purpose barangay responders',      header: 'bg-slate-600',  color: 'bg-slate-50 text-slate-700 border-slate-300'   },
];

const getTeamConfig = (team) => RESPONSE_TEAMS.find(t => t.value === team) ?? RESPONSE_TEAMS[3];
const suggestTeam   = (type) => ({ Medical: 'bhert', Fire: 'disaster', Crime: 'bpso', Accident: 'disaster' }[type] ?? 'general');


// ─── Emergency Type Icon ──────────────────────────────────────────────────────
function EmergencyIcon({ type, small = false }) {
  const icons = {
    Medical:  { icon: Ambulance,     color: 'text-red-600',    bg: 'bg-red-50 border-red-200'      },
    Fire:     { icon: Flame,         color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    Crime:    { icon: Shield,        color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200'   },
    Accident: { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'   },
  };
  const { icon: Icon, color, bg } = icons[type] ?? icons.Medical;
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wide ${styles[severity] ?? styles.high}`}>
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
    cancelled:  'bg-slate-100 text-slate-500 border-slate-300',
  };
  const dots = {
    pending:    'bg-red-500',
    dispatched: 'bg-blue-500',
    resolved:   'bg-green-500',
    cancelled:  'bg-slate-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize tracking-wide ${styles[status] ?? styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[status] ?? dots.pending}`} />
      {status}
    </span>
  );
}


// ─── Track Responder Modal (dynamic Leaflet — never crashes the page) ─────────
function TrackResponderModal({ emergency, responder, onClose }) {
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderStatus,   setResponderStatus]   = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [distance,          setDistance]          = useState(null);
  // Leaflet loaded dynamically so it never blocks page render
  const [leaflet,           setLeaflet]           = useState(null);

  const responderId  = responder?.id;
  const emergencyId  = emergency?.id;
  const emergencyLat = emergency?.latitude;
  const emergencyLng = emergency?.longitude;

  const calcDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return;
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2
               + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
               * Math.sin(dLon / 2) ** 2;
    setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
  }, []);

  // Load Leaflet dynamically on mount
  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([Lmod, RLmod]) => {
      const L = Lmod.default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      const blueIcon = new L.Icon({
        iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      const redIcon = new L.Icon({
        iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      setLeaflet({ L, ...RLmod, blueIcon, redIcon });
    }).catch(err => console.error('Leaflet load error', err));
  }, []);

  useEffect(() => {
    if (!responderId || !emergencyId) return;

    const init = async () => {
      setLoading(true);
      try {
        const { data: rd } = await supabase
          .from('responders')
          .select('current_lat, current_lng')
          .eq('id', responderId)
          .single();
        if (rd?.current_lat && rd?.current_lng) {
          setResponderLocation({ lat: rd.current_lat, lng: rd.current_lng });
          calcDistance(rd.current_lat, rd.current_lng, emergencyLat, emergencyLng);
        }
        const { data: em } = await supabase
          .from('emergencies')
          .select('responder_status')
          .eq('id', emergencyId)
          .single();
        if (em) setResponderStatus(em.responder_status);
      } catch (err) {
        console.error('TrackResponderModal init error', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    const ch1 = supabase
      .channel(`em-responder-loc-${responderId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responders', filter: `id=eq.${responderId}` }, ({ new: n }) => {
        if (n.current_lat && n.current_lng) {
          setResponderLocation({ lat: n.current_lat, lng: n.current_lng });
          calcDistance(n.current_lat, n.current_lng, emergencyLat, emergencyLng);
        }
      }).subscribe();

    const ch2 = supabase
      .channel(`em-status-${emergencyId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emergencies', filter: `id=eq.${emergencyId}` }, ({ new: n }) => {
        setResponderStatus(n.responder_status);
      }).subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('responders').select('current_lat, current_lng').eq('id', responderId).single();
      if (data?.current_lat && data?.current_lng) {
        setResponderLocation({ lat: data.current_lat, lng: data.current_lng });
        calcDistance(data.current_lat, data.current_lng, emergencyLat, emergencyLng);
      }
    }, 8000);

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      clearInterval(poll);
    };
  }, [responderId, emergencyId, emergencyLat, emergencyLng, calcDistance]);

  const statusLabel = { dispatched: 'Dispatched', en_route: 'En Route', on_scene: 'On Scene', completing: 'Completing' };
  const steps       = ['dispatched', 'en_route', 'on_scene', 'completing'];
  const curStep     = steps.indexOf(responderStatus);
  const teamCfg     = getTeamConfig(responder?.team ?? 'bpso');

  if (!responder) return null;

  // Render the live map only when Leaflet has loaded
  const renderMap = () => {
    if (!leaflet) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-50">
          <Loader className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      );
    }
    const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, blueIcon, redIcon, L } = leaflet;

    function MapUpdater({ responderLocation, emergencyLocation }) {
      const map = useMap();
      useEffect(() => {
        if (responderLocation && emergencyLocation) {
          map.fitBounds(
            L.latLngBounds(
              [responderLocation.lat, responderLocation.lng],
              [emergencyLocation.lat, emergencyLocation.lng],
            ),
            { padding: [50, 50] },
          );
        }
      }, [responderLocation, emergencyLocation, map]);
      return null;
    }

    if (responderLocation && emergencyLat && emergencyLng) {
      return (
        <MapContainer
          center={[responderLocation.lat, responderLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[responderLocation.lat, responderLocation.lng]} icon={blueIcon}>
            <Popup><strong>{responder.name}</strong><br /><span className="text-xs">Current Location</span></Popup>
          </Marker>
          <Marker position={[emergencyLat, emergencyLng]} icon={redIcon}>
            <Popup><strong>Emergency Site</strong><br /><span className="text-xs">{emergency.type} Emergency</span></Popup>
          </Marker>
          <Polyline
            positions={[[responderLocation.lat, responderLocation.lng], [emergencyLat, emergencyLng]]}
            pathOptions={{ color: '#475569', weight: 3, dashArray: '8, 8' }}
          />
          <MapUpdater
            responderLocation={responderLocation}
            emergencyLocation={{ lat: emergencyLat, lng: emergencyLng }}
          />
        </MapContainer>
      );
    }

    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center px-6">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 text-sm font-semibold">
            {!responderLocation ? 'Waiting for GPS data...' : 'Emergency has no coordinates'}
          </p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {!responderLocation
              ? `The responder's device (${responder.name}) must have GPS active. Updates every 10 seconds.`
              : 'The original emergency was submitted without GPS coordinates.'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-300 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Live Responder Tracking</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {responder.name}
              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${teamCfg.color}`}>
                <Users className="w-3 h-3" /> {teamCfg.label}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">Fetching live GPS data...</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Status',   value: responderStatus ? (statusLabel[responderStatus] ?? responderStatus) : 'Dispatched' },
                  { label: 'Distance', value: distance ? `${distance} km away` : (emergencyLat && emergencyLng ? 'Calculating...' : 'No coords') },
                  { label: 'GPS Feed', value: responderLocation ? 'Live' : 'Waiting for GPS...' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-200 rounded p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">{label}</p>
                    <p className={`text-sm font-bold ${label === 'GPS Feed' && responderLocation ? 'text-green-700' : 'text-slate-800'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="border border-slate-200 rounded overflow-hidden h-80">
                {renderMap()}
              </div>

              {/* Response Timeline */}
              <div className="border border-slate-200 rounded p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Response Timeline</p>
                <div className="flex items-center">
                  {steps.map((s, idx) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                          ${s === responderStatus ? 'bg-slate-700 text-white border-slate-700'
                            : curStep > idx ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-slate-400 border-slate-300'}`}>
                          {curStep > idx ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <p className={`text-xs font-medium text-center
                          ${s === responderStatus ? 'text-slate-800'
                            : curStep > idx ? 'text-green-700'
                            : 'text-slate-400'}`}>
                          {statusLabel[s]}
                        </p>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`h-0.5 flex-1 mb-5 ${curStep > idx ? 'bg-green-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Turn-by-turn directions */}
              {responderLocation && emergencyLat && emergencyLng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${responderLocation.lat},${responderLocation.lng}&destination=${emergencyLat},${emergencyLng}&travelmode=driving`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors"
                >
                  <Navigation className="w-4 h-4" /> Open Turn-by-Turn Directions
                </a>
              )}
            </>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
          <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Dispatch Modal (3-step: Team → Lead Picker → Confirm) ───────────────────
function DispatchModal({ isOpen, onClose, onDispatch, responders, emergencyType }) {
  const [selectedTeam,   setSelectedTeam]   = useState(() => suggestTeam(emergencyType));
  const [step,           setStep]           = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [deploying,      setDeploying]      = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTeam(suggestTeam(emergencyType));
      setStep(1);
      setSelectedLeadId(null);
      setDeploying(false);
    }
  }, [isOpen, emergencyType]);

  if (!isOpen) return null;

  const teamSummary = RESPONSE_TEAMS.map(team => {
    const members   = responders.filter(r => (r.team ?? 'bpso') === team.value);
    const available = members.filter(r => r.status === 'available');
    const busy      = members.filter(r => r.status === 'busy');
    return { ...team, members, available, busy };
  });

  const selectedTeamData = teamSummary.find(t => t.value === selectedTeam);
  const selectedLead     = selectedTeamData?.available.find(m => m.id === selectedLeadId);
  const aiSuggestedTeam  = suggestTeam(emergencyType);

  const handleConfirmDeploy = async () => {
    setDeploying(true);
    await onDispatch(selectedTeam, selectedTeamData, selectedLeadId);
    setDeploying(false);
  };

  // ── Step 1: Team Selection ─────────────────────────────────────────────────
  if (step === 1) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Send className="w-4 h-4" /> Dispatch Response Team
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Select a team to respond to this emergency</p>
          <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> AI recommends
            <strong className="text-white ml-1">{getTeamConfig(aiSuggestedTeam).label}</strong>
          </p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Step 1 of 3 — Select team</p>
          {teamSummary.map(team => {
            const isSelected   = selectedTeam === team.value;
            const isAiPick     = aiSuggestedTeam === team.value;
            const hasAvailable = team.available.length > 0;
            return (
              <button
                key={team.value}
                onClick={() => hasAvailable && setSelectedTeam(team.value)}
                disabled={!hasAvailable}
                className={`w-full flex items-center justify-between p-4 rounded border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed
                  ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${team.header} rounded flex items-center justify-center flex-shrink-0`}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{team.label}</p>
                      {isAiPick && (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2 py-0.5 rounded font-semibold">
                          <Bot className="w-3 h-3" /> AI Pick
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{team.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">{team.available.length} available</span>
                  {team.busy.length > 0 && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">{team.busy.length} busy</span>}
                  {!hasAvailable && <span className="text-xs text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">Unavailable</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { setSelectedLeadId(selectedTeamData?.available[0]?.id ?? null); setStep(2); }}
            disabled={!selectedTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Next — Pick Lead
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Lead Responder Picker ──────────────────────────────────────────
  if (step === 2) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-300" /> Pick Lead Responder
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{selectedTeamData?.label} — Step 2 of 3</p>
          </div>
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white p-1.5 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 font-medium">
              Select <strong>one member</strong> whose GPS will be tracked live on the map.
              All available members will be dispatched.
            </p>
          </div>

          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
            Available — {selectedTeamData?.available.length} member{selectedTeamData?.available.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {selectedTeamData?.available.map(member => {
              const isSelected = selectedLeadId === member.id;
              const hasGPS     = member.current_lat && member.current_lng;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedLeadId(member.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded border-2 transition-all text-left
                    ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {member.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{member.name}</p>
                      <span className={`text-xs font-medium flex items-center gap-1 ${hasGPS ? 'text-green-600' : 'text-amber-600'}`}>
                        <MapPin className="w-3 h-3" /> {hasGPS ? 'GPS Active' : 'No GPS yet'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2.5 py-1 rounded-full font-bold">
                        <Radio className="w-3 h-3" /> Lead
                      </span>
                    )}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-slate-700 bg-slate-700' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!selectedLeadId && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2.5 mt-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Please select a lead responder to continue.
            </p>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Back
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={!selectedLeadId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Next — Confirm
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 3: Final Confirmation ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Confirm Dispatch
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Step 3 of 3 — Review before sending</p>
          </div>
          <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white p-1.5 rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Dispatch Summary</p>
            {selectedTeamData && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${selectedTeamData.header} rounded flex items-center justify-center flex-shrink-0`}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedTeamData.label}</p>
                    <p className="text-xs text-slate-500">{selectedTeamData.available.length} members will be dispatched</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">All dispatched members</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTeamData.available.map(m => (
                      <span
                        key={m.id}
                        className={`text-xs px-2 py-0.5 rounded font-medium border ${m.id === selectedLeadId ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300'}`}
                      >
                        {m.name}{m.id === selectedLeadId ? ' (Lead)' : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedLead && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-800">Live Tracking — {selectedLead.name}</p>
                      <p className="text-xs text-blue-600 mt-0.5">This person's GPS will be shown on the map</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              This marks the emergency as <strong>Dispatched</strong> and sets all dispatched members to <strong>Busy</strong>. This action will be logged.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={() => setStep(2)} disabled={deploying} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors">
            Go Back
          </button>
          <button
            onClick={handleConfirmDeploy}
            disabled={deploying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50"
          >
            {deploying
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Dispatching...</>
              : <><Send className="w-3.5 h-3.5" /> Yes, Dispatch Team</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Emergency Detail Modal ───────────────────────────────────────────────────
function EmergencyDetailModal({ emergency, onClose, onOpenDispatch, onResolve, onCallUser, onTrackResponder }) {
  if (!emergency) return null;
  const isCancelled = emergency.status === 'cancelled';

  const timeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1)  return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr${Math.floor(minutes / 60) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border ${isCancelled ? 'border-slate-300 opacity-90' : 'border-slate-200'}`}>

        <div className={`sticky top-0 ${isCancelled ? 'bg-slate-600' : 'bg-slate-800'} px-6 py-4 z-10 rounded-t-lg flex items-start justify-between`}>
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">REF {emergency.id.slice(0, 8).toUpperCase()}</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
              {isCancelled && <BanIcon className="w-4 h-4 text-slate-300" />}
              {emergency.type} Emergency
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SeverityBadge severity={emergency.severity ?? 'high'} />
              <StatusBadge status={emergency.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded border border-slate-600">
                <Clock className="w-3 h-3" /> {timeAgo(emergency.created_at)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCancelled && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-2">
            <BanIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-slate-500">
              This emergency was <span className="text-slate-700">cancelled by the reporter</span> as a false alarm. No action is required.
            </p>
          </div>
        )}

        <div className="p-6 space-y-4">

          {/* Incident Classification */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Incident Classification
              </p>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <EmergencyIcon type={emergency.type} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{emergency.type} Emergency</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reported {new Date(emergency.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {!isCancelled && emergency.status === 'pending' && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold ${getTeamConfig(suggestTeam(emergency.type)).color}`}>
                  <Users className="w-3.5 h-3.5" />
                  Recommended: {getTeamConfig(suggestTeam(emergency.type)).label}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Incident Description
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
                <MapPin className="w-3.5 h-3.5" /> Location Information
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">{emergency.location_text ?? 'GPS Coordinates Provided'}</p>
              <p className="text-xs text-slate-500 font-mono">{emergency.latitude?.toFixed(5)}, {emergency.longitude?.toFixed(5)}</p>
              <div className="flex gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" /> Open in Maps
                </a>
                {!isCancelled && (
                  <button
                    onClick={() => onCallUser(emergency)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Reporter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dispatched Team Info */}
          {emergency.status === 'dispatched' && emergency.assigned_team && (
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5" /> Dispatched Team
                </p>
                {emergency.responder_id && (
                  <button
                    onClick={() => onTrackResponder(emergency)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Track Lead Responder
                  </button>
                )}
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${getTeamConfig(emergency.assigned_team).header} rounded flex items-center justify-center`}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{getTeamConfig(emergency.assigned_team).label}</p>
                  <p className="text-xs text-slate-500">{getTeamConfig(emergency.assigned_team).description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Close
          </button>
          {emergency.status === 'pending' && !isCancelled && (
            <button
              onClick={() => onOpenDispatch(emergency)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors"
            >
              <Radio className="w-4 h-4" /> Dispatch Response Team
            </button>
          )}
          {emergency.status === 'dispatched' && (
            <>
              {emergency.responder_id && (
                <button
                  onClick={() => onTrackResponder(emergency)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors"
                >
                  <Navigation className="w-4 h-4" /> Track
                </button>
              )}
              <button
                onClick={() => onResolve(emergency.id, emergency.assigned_team)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Mark as Resolved
              </button>
            </>
          )}
          {isCancelled && (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 text-sm font-semibold rounded cursor-not-allowed">
              <BanIcon className="w-4 h-4" /> False Alarm — No Action Required
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function Emergency() {
  const [emergencies,         setEmergencies]         = useState([]);
  const [responders,          setResponders]          = useState([]);
  const [selectedEmergency,   setSelectedEmergency]   = useState(null);
  const [isDispatchOpen,      setIsDispatchOpen]      = useState(false);
  const [emergencyToDispatch, setEmergencyToDispatch] = useState(null);
  const [filterStatus,        setFilterStatus]        = useState('All');
  const [isCallOpen,          setIsCallOpen]          = useState(false);
  const [activeCallId,        setActiveCallId]        = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [realtimeStatus,      setRealtimeStatus]      = useState('connecting');
  const [trackingModalOpen,   setTrackingModalOpen]   = useState(false);
  const [trackingEmergency,   setTrackingEmergency]   = useState(null);
  const [trackingResponder,   setTrackingResponder]   = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: emData,  error: emError } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
      const { data: resData }                  = await supabase.from('responders').select('*');
      if (emError) console.error('fetchData error', emError);
      if (emData)  setEmergencies(emData);
      if (resData) setResponders(resData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-emergency-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, payload => {
        if      (payload.eventType === 'INSERT') setEmergencies(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') {
          setEmergencies(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
          setSelectedEmergency(prev => prev?.id === payload.new.id ? payload.new : prev);
        }
        else if (payload.eventType === 'DELETE') setEmergencies(prev => prev.filter(e => e.id !== payload.old.id));
      })
      .subscribe(status => setRealtimeStatus(status === 'SUBSCRIBED' ? 'live' : 'error'));
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

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

  const handleDispatch = async (teamValue, teamData, leadResponderId) => {
    if (!emergencyToDispatch) return;
    try {
      const availableMembers = teamData.available ?? [];
      const memberNames      = availableMembers.map(m => m.name).join(', ');
      const leadResponder    = availableMembers.find(m => m.id === leadResponderId);

      if (availableMembers.length > 0) {
        const { error: responderErr } = await supabase
          .from('responders')
          .update({ status: 'busy' })
          .in('id', availableMembers.map(m => m.id));
        if (responderErr) throw responderErr;
      }

      const { error: emergencyErr } = await supabase
        .from('emergencies')
        .update({
          status:           'dispatched',
          assigned_team:    teamValue,
          responder_id:     leadResponderId ?? availableMembers[0]?.id ?? null,
          responder_status: 'dispatched',
        })
        .eq('id', emergencyToDispatch.id);
      if (emergencyErr) throw emergencyErr;

      try {
        await logAuditAction({
          action:      'deploy',
          actionType:  'emergency',
          description: `Dispatched ${teamData.label} to ${emergencyToDispatch.type} emergency (${emergencyToDispatch.id.slice(0, 8).toUpperCase()}). Lead: ${leadResponder?.name ?? 'N/A'}. Members: ${memberNames}.`,
          severity:    'critical',
          targetId:    emergencyToDispatch.id,
          targetType:  'emergency',
          targetName:  `${emergencyToDispatch.type} Emergency`,
          newValues: {
            team:            teamValue,
            teamLabel:       teamData.label,
            lead:            leadResponder?.name ?? null,
            leadId:          leadResponderId      ?? null,
            membersDeployed: availableMembers.length,
            memberNames,
          },
        });
      } catch (auditErr) {
        console.error('⚠️ Audit log failed for emergency dispatch:', auditErr);
      }

      setIsDispatchOpen(false);
      setEmergencyToDispatch(null);
      setSelectedEmergency(null);
      fetchData();
    } catch (err) {
      console.error('❌ handleDispatch error:', err);
      alert('Dispatch failed. Please try again.');
    }
  };

  const handleTrackResponder = async (emergency) => {
    if (!emergency) return;
    const leadId = emergency.responder_id;
    if (leadId) {
      const { data: responder } = await supabase
        .from('responders')
        .select('*')
        .eq('id', leadId)
        .single();
      if (responder) {
        setTrackingEmergency(emergency);
        setTrackingResponder(responder);
        setTrackingModalOpen(true);
        return;
      }
    }
    const fallback = responders.find(r => r.status === 'busy' && r.team === emergency.assigned_team)
                  ?? responders.find(r => r.status === 'busy');
    if (!fallback) {
      alert('No active responder found. The responder may not have GPS enabled yet.');
      return;
    }
    setTrackingEmergency(emergency);
    setTrackingResponder(fallback);
    setTrackingModalOpen(true);
  };

  const handleResolve = async (emergencyId, assignedTeam) => {
    if (!confirm('Confirm resolution of this emergency?')) return;
    try {
      const { error } = await supabase.from('emergencies').update({ status: 'resolved' }).eq('id', emergencyId);
      if (error) throw error;

      if (assignedTeam) {
        const teamMembers = responders.filter(r => r.team === assignedTeam && r.status === 'busy');
        if (teamMembers.length > 0) {
          await supabase.from('responders').update({ status: 'available' }).in('id', teamMembers.map(m => m.id));
        }
      }

      try {
        await logAuditAction({
          action:      'resolve',
          actionType:  'emergency',
          description: `Resolved emergency (${emergencyId.slice(0, 8).toUpperCase()}). Team ${assignedTeam ? getTeamConfig(assignedTeam).label : 'N/A'} freed.`,
          severity:    'info',
          targetId:    emergencyId,
          targetType:  'emergency',
          targetName:  'Emergency',
        });
      } catch (auditErr) {
        console.error('⚠️ Audit log failed for resolve:', auditErr);
      }

      setSelectedEmergency(null);
      fetchData();
    } catch (err) {
      console.error('❌ Resolve error:', err);
      alert('Failed to resolve. Please try again.');
    }
  };

  const filteredEmergencies = emergencies.filter(e =>
    filterStatus === 'All' ? e.status !== 'cancelled' : e.status === filterStatus
  );

  const stats = {
    total:      emergencies.length,
    pending:    emergencies.filter(e => e.status === 'pending').length,
    dispatched: emergencies.filter(e => e.status === 'dispatched').length,
    resolved:   emergencies.filter(e => e.status === 'resolved').length,
    cancelled:  emergencies.filter(e => e.status === 'cancelled').length,
  };

  const borderColor = { pending: 'border-l-red-500', dispatched: 'border-l-blue-500', resolved: 'border-l-green-500', cancelled: 'border-l-slate-300' };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Emergency Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and dispatch responses to active emergency alerts in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold ${realtimeStatus === 'live' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {realtimeStatus === 'live' ? 'Realtime Live' : 'Realtime Error'}
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',      value: stats.total,      icon: FileText,      color: 'text-slate-700' },
          { label: 'Pending',    value: stats.pending,    icon: AlertTriangle, color: 'text-red-600'   },
          { label: 'Dispatched', value: stats.dispatched, icon: Radio,         color: 'text-blue-600'  },
          { label: 'Resolved',   value: stats.resolved,   icon: CheckCircle,   color: 'text-green-600' },
          { label: 'Cancelled',  value: stats.cancelled,  icon: BanIcon,       color: 'text-slate-400' },
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

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Disposition Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700">
            <option value="All">All Active</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled / False Alarms</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            Showing <strong className="text-slate-600">{filteredEmergencies.length}</strong> of <strong className="text-slate-600">{emergencies.length}</strong> incidents
          </span>
        </div>
      </div>

      {/* Emergency List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading emergency records...</span>
        </div>
      ) : filteredEmergencies.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No emergency records found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filterStatus === 'All' ? 'No active emergencies. Cancelled records are hidden — use the filter to view them.' : 'Adjust your filter or check back later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmergencies.map(emergency => {
            const isCancelled = emergency.status === 'cancelled';
            const teamCfg     = emergency.assigned_team ? getTeamConfig(emergency.assigned_team) : null;
            return (
              <div key={emergency.id} className={`bg-white border border-slate-200 border-l-4 rounded-lg shadow-sm transition-all ${borderColor[emergency.status] ?? 'border-l-slate-300'} ${isCancelled ? 'opacity-60' : 'hover:shadow-md'}`}>

                {emergency.status === 'dispatched' && emergency.responder_id && (
                  <div className="bg-slate-700 px-4 py-1.5 flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                      <Radio className="w-3.5 h-3.5" /> Responder Dispatched
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleTrackResponder(emergency); }}
                      className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Track
                    </button>
                  </div>
                )}

                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <EmergencyIcon type={emergency.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-bold text-sm ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {emergency.type} Emergency
                        </h3>
                        <StatusBadge status={emergency.status} />
                        {emergency.severity && !isCancelled && <SeverityBadge severity={emergency.severity} />}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <BanIcon className="w-3 h-3" /> False alarm
                          </span>
                        )}
                        {teamCfg && emergency.status === 'dispatched' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${teamCfg.color}`}>
                            <Users className="w-3 h-3" /> {teamCfg.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">{emergency.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emergency.location_text ?? 'GPS Location'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(emergency.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-mono text-slate-300">{emergency.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setSelectedEmergency(emergency)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {emergency.status === 'pending' && (
                      <button onClick={() => openDispatchModal(emergency)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors">
                        <Radio className="w-3.5 h-3.5" /> Dispatch
                      </button>
                    )}
                    {emergency.status === 'dispatched' && (
                      <button onClick={() => handleResolve(emergency.id, emergency.assigned_team)} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded text-xs font-semibold hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <EmergencyDetailModal
        emergency={selectedEmergency}
        onClose={() => setSelectedEmergency(null)}
        onOpenDispatch={(e) => { openDispatchModal(e); setSelectedEmergency(null); }}
        onResolve={handleResolve}
        onCallUser={handleStartCall}
        onTrackResponder={handleTrackResponder}
      />
      <DispatchModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onDispatch={handleDispatch}
        responders={responders}
        emergencyType={emergencyToDispatch?.type}
      />
      {trackingModalOpen && trackingEmergency && trackingResponder && (
        <TrackResponderModal
          emergency={trackingEmergency}
          responder={trackingResponder}
          onClose={() => { setTrackingModalOpen(false); setTrackingEmergency(null); setTrackingResponder(null); }}
        />
      )}
      <CallModal
        isOpen={isCallOpen}
        emergencyId={activeCallId}
        onClose={() => { setIsCallOpen(false); setActiveCallId(null); }}
      />
    </div>
  );
}
