// src/pages/Emergency.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeJurisdiction, buildEmergencyShareText } from '../utils/barangayJurisdiction';
import { supabase } from '../config/supabase';
import { logAuditAction } from '../utils/auditLogger';
import CallModal from '../components/CallModal';
import UserActionModal from '../components/UserActionModal';
import {
  AlertTriangle, Phone, MapPin, Clock, X, CheckCircle,
  Navigation, Ambulance, Flame, Shield, Zap, MessageSquare,
  Eye, RefreshCw, Filter, ArrowRight, FileText, Radio,
  Users, BanIcon, Send, Bot, Loader,
  User, Mail, ShieldAlert, Flag, Car, Crosshair, Route, Share2, ExternalLink,
} from 'lucide-react';

const RESPONSE_TEAMS = [
  { value:'bpso',    label:'BPSO Team',             description:'Barangay Public Safety Officers',        header:'bg-blue-700',   color:'bg-blue-50 text-blue-700 border-blue-300'     },
  { value:'disaster',label:'Disaster Response Team', description:'Emergency disaster operations',           header:'bg-orange-700', color:'bg-orange-50 text-orange-700 border-orange-300' },
  { value:'bhert',   label:'BHERT',                  description:'Barangay Health Emergency Response Team', header:'bg-green-700',  color:'bg-green-50 text-green-700 border-green-300'   },
  { value:'general', label:'General Response',       description:'Multi-purpose barangay responders',      header:'bg-slate-600',  color:'bg-slate-50 text-slate-700 border-slate-300'   },
];
const getTeamConfig = (team) => RESPONSE_TEAMS.find(t => t.value === team) ?? RESPONSE_TEAMS[3];
const suggestTeam   = (type) => ({ Medical:'bhert', Fire:'disaster', Crime:'bpso', Accident:'disaster' }[type] ?? 'general');

function resolveReporterName(user) {
  if (!user) return 'Anonymous';
  return user.full_name?.trim() || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Unknown';
}

function ReporterAvatar({ user, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-sm';
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (user?.first_name?.[0] ?? '?').toUpperCase();
  if (user?.avatar_url) return <img src={user.avatar_url} alt={resolveReporterName(user)} className={`${dim} rounded-full object-cover border border-slate-200 flex-shrink-0`} />;
  return <div className={`${dim} rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center flex-shrink-0`}>{initials}</div>;
}

function ReporterPanel({ user, onCallUser, emergency, isCancelled, onUserAction }) {
  if (!user) return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5" /> Reporter</p>
      </div>
      <div className="p-4 flex items-center gap-2 text-slate-400">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <p className="text-xs">Anonymous report — no registered account linked.</p>
      </div>
    </div>
  );
  const name = resolveReporterName(user);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5" /> Reporter</p>
        {user.verification_status === 'approved' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3" /> Verified Resident
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <ReporterAvatar user={user} size="lg" />
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{user.account_type ?? 'resident'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {user.phone && <div><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p><p className="text-sm text-slate-800 font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{user.phone}</p></div>}
          {user.email && <div><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Email</p><p className="text-sm text-slate-800 font-medium flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{user.email}</p></div>}
          {(user.purok || user.barangay || user.address) && (
            <div className="md:col-span-2"><p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Address on File</p>
              <p className="text-sm text-slate-800 font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{[user.purok, user.barangay, user.city].filter(Boolean).join(', ') || user.address}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {!isCancelled && user.phone && (
            <button onClick={() => onCallUser(emergency)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call Reporter — {user.phone}
            </button>
          )}
          {onUserAction && (
            <button onClick={() => onUserAction(user)} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded transition-colors">
              <Flag className="w-3.5 h-3.5" /> Flag / Suspend / Ban Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmergencyIcon({ type, small = false }) {
  const icons = {
    Medical:  { icon: Ambulance,     color: 'text-red-600',    bg: 'bg-red-50 border-red-200'       },
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

function SeverityBadge({ severity }) {
  const styles = { critical:'bg-red-50 text-red-700 border-red-400', urgent:'bg-red-50 text-red-700 border-red-300', high:'bg-orange-50 text-orange-700 border-orange-300', medium:'bg-amber-50 text-amber-700 border-amber-300', low:'bg-slate-50 text-slate-600 border-slate-300' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-bold uppercase tracking-wide ${styles[severity] ?? styles.high}`}>
      {(severity === 'critical' || severity === 'urgent') && <Zap className="w-3 h-3" />}{severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = { pending:'bg-red-50 text-red-700 border-red-300', dispatched:'bg-blue-50 text-blue-700 border-blue-300', resolved:'bg-green-50 text-green-700 border-green-300', cancelled:'bg-slate-100 text-slate-500 border-slate-300' };
  const dots   = { pending:'bg-red-500', dispatched:'bg-blue-500', resolved:'bg-green-500', cancelled:'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize tracking-wide ${styles[status] ?? styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[status] ?? dots.pending}`} />{status}
    </span>
  );
}

// ─── Track Responder Modal — Uber-style live tracking ─────────────────────────
function TrackResponderModal({ emergency, responder, onClose }) {
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderStatus,   setResponderStatus]   = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [distance,          setDistance]          = useState(null);
  const [routeCoords,       setRouteCoords]       = useState([]);
  const [routeInfo,         setRouteInfo]         = useState(null);
  const [fetchingRoute,     setFetchingRoute]     = useState(false);
  const [leaflet,           setLeaflet]           = useState(null);

  const responderId  = responder?.id;
  const emergencyId  = emergency?.id;
  const emergencyLat = emergency?.latitude;
  const emergencyLng = emergency?.longitude;

  const lastFetchRef = useRef(null);
  const routeRef     = useRef([]);

  const calcDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2 +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  }, []);

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R    = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2 +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                 Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const fetchRoute = useCallback(async (fromLat, fromLng) => {
    if (!fromLat || !fromLng || !emergencyLat || !emergencyLng) return;
    setFetchingRoute(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-route', {
        body: { originLat: fromLat, originLng: fromLng, destLat: emergencyLat, destLng: emergencyLng },
      });
      if (error || !data?.coordinates?.length) return;
      setRouteCoords(data.coordinates);
      routeRef.current = data.coordinates;
      setRouteInfo({ distance: data.distance ? `${(data.distance / 1000).toFixed(1)} km` : null, durationSec: data.duration || null });
      lastFetchRef.current = { lat: fromLat, lng: fromLng };
    } catch {}
    finally { setFetchingRoute(false); }
  }, [emergencyLat, emergencyLng]);

  // Load Leaflet with custom icons
  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([Lmod, RLmod]) => {
        const L = Lmod.default;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        const pulsingIcon = (color = '#0099FF') => new L.DivIcon({
          html: `
            <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${color}22;animation:epulse1 1.6s ease-out infinite;"></div>
              <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:${color}33;animation:epulse2 1.6s ease-out 0.5s infinite;"></div>
              <div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M5 13l4 4L19 7"/></svg>
              </div>
            </div>
            <style>
              @keyframes epulse1{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(1.5);opacity:0}}
              @keyframes epulse2{0%{transform:scale(0.6);opacity:0.6}100%{transform:scale(1.3);opacity:0}}
            </style>`,
          className: '', iconSize: [44, 44], iconAnchor: [22, 22],
        });
        const destIcon = new L.DivIcon({
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:32px;height:32px;background:#FF3B30;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(255,59,48,0.5);display:flex;align-items:center;justify-content:center;">
                <div style="transform:rotate(45deg);width:10px;height:10px;background:white;border-radius:50%;"></div>
              </div>
            </div>`,
          className: '', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
        });
        setLeaflet({ L, ...RLmod,
          enRoutePulse:  pulsingIcon('#0099FF'),
          onScenePulse:  pulsingIcon('#00C48C'),
          assignedPulse: pulsingIcon('#FF8C00'),
          destIcon,
        });
      }).catch(console.error);
  }, []);

  // Init data + subscriptions
  useEffect(() => {
    if (!responderId || !emergencyId) return;
    const init = async () => {
      setLoading(true);
      try {
        const { data: rd } = await supabase.from('responders').select('current_lat,current_lng').eq('id', responderId).single();
        if (rd?.current_lat && rd?.current_lng) {
          setResponderLocation({ lat: rd.current_lat, lng: rd.current_lng });
          setDistance(calcDistance(rd.current_lat, rd.current_lng, emergencyLat, emergencyLng));
          await fetchRoute(rd.current_lat, rd.current_lng);
        }
        const { data: em } = await supabase.from('emergencies').select('responder_status').eq('id', emergencyId).single();
        if (em) setResponderStatus(em.responder_status);
      } finally { setLoading(false); }
    };
    init();

    // Realtime GPS updates
    const ch1 = supabase.channel(`em-track-resp-${responderId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responders', filter: `id=eq.${responderId}` },
        async ({ new: n }) => {
          if (!n.current_lat || !n.current_lng) return;
          const newLoc = { lat: n.current_lat, lng: n.current_lng };
          setResponderLocation(newLoc);
          setDistance(calcDistance(n.current_lat, n.current_lng, emergencyLat, emergencyLng));
          const last = lastFetchRef.current;
          if (!last || getDistanceMeters(last.lat, last.lng, n.current_lat, n.current_lng) > 40) {
            await fetchRoute(n.current_lat, n.current_lng);
          }
        }
      ).subscribe();

    // Realtime status updates
    const ch2 = supabase.channel(`em-track-status-${emergencyId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emergencies', filter: `id=eq.${emergencyId}` },
        ({ new: n }) => setResponderStatus(n.responder_status)
      ).subscribe();

    // Fallback polling every 10s
    const poll = setInterval(async () => {
      const { data } = await supabase.from('responders').select('current_lat,current_lng').eq('id', responderId).single();
      if (data?.current_lat && data?.current_lng) {
        const newLoc = { lat: data.current_lat, lng: data.current_lng };
        setResponderLocation(newLoc);
        setDistance(calcDistance(data.current_lat, data.current_lng, emergencyLat, emergencyLng));
        const last = lastFetchRef.current;
        if (!last || getDistanceMeters(last.lat, last.lng, data.current_lat, data.current_lng) > 40) {
          await fetchRoute(data.current_lat, data.current_lng);
        }
      }
    }, 10000);

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); clearInterval(poll); };
  }, [responderId, emergencyId, emergencyLat, emergencyLng, calcDistance, fetchRoute]);

  const fmtETA = (sec) => {
    if (!sec || sec <= 0) return 'Arriving';
    const m = Math.floor(sec / 60);
    if (m <= 0) return '< 1 min';
    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m} min`;
  };

  const statusSteps = [
    { key: 'dispatched', label: 'Dispatched', icon: <Send className="w-3.5 h-3.5" /> },
    { key: 'en_route',   label: 'En Route',   icon: <Car className="w-3.5 h-3.5" />  },
    { key: 'on_scene',   label: 'On Scene',   icon: <MapPin className="w-3.5 h-3.5" /> },
    { key: 'completing', label: 'Completing', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ];
  const stepOrder  = ['dispatched', 'en_route', 'on_scene', 'completing'];
  const activeStep = stepOrder.indexOf(responderStatus);
  const teamCfg    = getTeamConfig(responder?.team ?? 'bpso');
  const isArrived  = ['on_scene', 'completing'].includes(responderStatus);

  const renderMap = () => {
    if (!leaflet) return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <Loader className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
    const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, enRoutePulse, onScenePulse, assignedPulse, destIcon, L } = leaflet;
    const responderIcon = responderStatus === 'on_scene' ? onScenePulse : responderStatus === 'en_route' ? enRoutePulse : assignedPulse;

    function MapFitter({ respLoc, destLat, destLng, route }) {
      const map = useMap();
      useEffect(() => {
        if (!map) return;
        if (route?.length > 1) {
          map.fitBounds(L.latLngBounds(route.map(c => [c.latitude, c.longitude])), { padding: [40, 40] });
        } else if (respLoc && destLat && destLng) {
          map.fitBounds(L.latLngBounds([[respLoc.lat, respLoc.lng], [destLat, destLng]]), { padding: [60, 60] });
        }
      }, []);
      return null;
    }

    const center = responderLocation ? [responderLocation.lat, responderLocation.lng]
                 : emergencyLat && emergencyLng ? [emergencyLat, emergencyLng] : [14.5995, 120.9842];

    return (
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {/* Route: shadow + coloured line */}
        {routeCoords.length > 1 && (
          <>
            <Polyline positions={routeCoords.map(c => [c.latitude, c.longitude])} pathOptions={{ color: '#000000', weight: 9, opacity: 0.3, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={routeCoords.map(c => [c.latitude, c.longitude])} pathOptions={{ color: isArrived ? '#00C48C' : '#FF2D3E', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          </>
        )}
        {/* Pulsing responder marker */}
        {responderLocation && (
          <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
            <Popup>
              <div className="text-xs font-bold">{responder?.name}</div>
              <div className="text-xs text-slate-500">{teamCfg.label}</div>
              {distance && <div className="text-xs text-red-600 mt-1">{distance} km from scene</div>}
            </Popup>
          </Marker>
        )}
        {/* Destination teardrop pin */}
        {emergencyLat && emergencyLng && (
          <Marker position={[emergencyLat, emergencyLng]} icon={destIcon}>
            <Popup><div className="text-xs font-bold">{emergency.type} Emergency</div></Popup>
          </Marker>
        )}
        <MapFitter respLoc={responderLocation} destLat={emergencyLat} destLng={emergencyLng} route={routeCoords} />
      </MapContainer>
    );
  };

  if (!responder) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-slate-700 flex flex-col">

        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                {responder.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                responderStatus === 'on_scene' ? 'bg-green-500' : responderStatus === 'en_route' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{responder.name}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${teamCfg.color}`}>
                  <Users className="w-3 h-3" />{teamCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`flex items-center gap-1 text-xs font-semibold ${responderLocation ? 'text-green-400' : 'text-amber-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${responderLocation ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                  {responderLocation ? 'GPS LIVE' : 'LOCATING...'}
                </div>
                {fetchingRoute && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <Loader className="w-3 h-3 animate-spin" />ROUTE UPDATING
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

          {/* Map */}
          <div className="flex-1 min-h-64 md:min-h-0 relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center bg-slate-900 gap-3">
                <Loader className="w-8 h-8 text-slate-400 animate-spin" />
                <p className="text-sm text-slate-400">Connecting to GPS feed...</p>
              </div>
            ) : renderMap()}

            {/* ETA overlay */}
            {!loading && responderStatus === 'en_route' && routeInfo && (
              <div className="absolute top-3 left-3 bg-slate-900/90 rounded-xl px-4 py-3 border border-red-900 backdrop-blur-sm">
                <div className="text-2xl font-black text-red-400 leading-none">{fmtETA(routeInfo.durationSec)}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">ETA</div>
                {routeInfo.distance && (
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                    <Route className="w-3 h-3" />{routeInfo.distance}
                  </div>
                )}
              </div>
            )}
            {isArrived && (
              <div className="absolute top-3 left-3 bg-green-900/90 rounded-xl px-4 py-3 border border-green-700 backdrop-blur-sm">
                <div className="text-sm font-black text-green-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />RESPONDER ON SCENE
                </div>
              </div>
            )}
            {!loading && !responderLocation && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                <div className="text-center px-8">
                  <Crosshair className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">Waiting for GPS signal</p>
                  <p className="text-xs text-slate-500 mt-1">The responder's device must have location active. Updates every 10 seconds.</p>
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="w-full md:w-72 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col overflow-y-auto">

            {/* Progress pipeline */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Response Progress</p>
              <div className="space-y-1">
                {statusSteps.map((step, i) => {
                  const done   = i <  activeStep;
                  const active = i === activeStep;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done   ? 'bg-green-600 border-green-600 text-white' :
                          active ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30' :
                                   'bg-slate-800 border-slate-700 text-slate-600'
                        }`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : step.icon}
                        </div>
                        {i < statusSteps.length - 1 && (
                          <div className={`w-0.5 h-5 mt-1 ${done ? 'bg-green-600' : 'bg-slate-700'}`} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`text-xs font-bold ${done ? 'text-green-400' : active ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                        {active && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {step.key === 'en_route'   ? `${distance ? distance + ' km away' : 'In transit'}` :
                             step.key === 'on_scene'   ? 'Attending to emergency' :
                             step.key === 'dispatched' ? 'Heading to scene' : 'Wrapping up'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live stats grid */}
            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Distance', value: distance ? `${distance} km` : '—',     icon: <Route className="w-3.5 h-3.5" />,     color: 'text-red-400'   },
                  { label: 'ETA',      value: isArrived ? 'On Scene' : fmtETA(routeInfo?.durationSec), icon: <Clock className="w-3.5 h-3.5" />, color: isArrived ? 'text-green-400' : 'text-red-400' },
                  { label: 'Route',    value: routeInfo?.distance || (routeCoords.length > 1 ? 'Loaded' : 'Pending'), icon: <Navigation className="w-3.5 h-3.5" />, color: routeCoords.length > 1 ? 'text-green-400' : 'text-slate-400' },
                  { label: 'GPS Feed', value: responderLocation ? 'Live' : 'Searching', icon: <Crosshair className="w-3.5 h-3.5" />, color: responderLocation ? 'text-green-400' : 'text-amber-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-xs font-bold uppercase tracking-wide">{label}</span></div>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GPS coords */}
            {responderLocation && (
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Responder GPS</p>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 font-mono text-xs text-slate-300">
                  <div>{responderLocation.lat.toFixed(6)},</div>
                  <div>{responderLocation.lng.toFixed(6)}</div>
                </div>
              </div>
            )}

            {/* Directions */}
            {responderLocation && emergencyLat && emergencyLng && (
              <div className="px-5 py-4">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${responderLocation.lat},${responderLocation.lng}&destination=${emergencyLat},${emergencyLng}&travelmode=driving`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border-t border-slate-700 px-6 py-3 shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Jurisdiction Banner + Share ─────────────────────────────────────────────
function JurisdictionBanner({ jurisdictionResult, scanning, incident, buildShareText }) {
  const [shareResult, setShareResult] = useState(null);

  if (scanning) return (
    <div className="border border-amber-200 rounded-lg bg-amber-50 px-4 py-3 flex items-center gap-3">
      <Loader className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
      <div>
        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Checking Jurisdiction</p>
        <p className="text-xs text-amber-600 mt-0.5">AI is analysing location coordinates...</p>
      </div>
    </div>
  );

  if (!jurisdictionResult?.isOutside) return null;

  const { detectedBarangay, detectedCity, detectedProvince, confidence, reasoning, contactSuggestion } = jurisdictionResult;
  const shareText = buildShareText(incident, jurisdictionResult);
  const mapsUrl   = incident.latitude && incident.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`
    : '';

  const confidenceColor = { high:'text-red-700 bg-red-100 border-red-300', medium:'text-amber-700 bg-amber-100 border-amber-300', low:'text-slate-600 bg-slate-100 border-slate-300' }[confidence] || 'text-amber-700 bg-amber-100 border-amber-300';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: detectedBarangay ? `Emergency in ${detectedBarangay} — Needs Forwarding` : 'Emergency Outside Salvacion',
          text:  shareText,
          url:   mapsUrl,
        });
        setShareResult('shared');
        setTimeout(() => setShareResult(null), 3000);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareResult('copied');
      setTimeout(() => setShareResult(null), 3000);
    } catch {
      setShareResult('error');
      setTimeout(() => setShareResult(null), 3000);
    }
  };

  return (
    <div className="border border-amber-300 rounded-lg overflow-hidden">
      <div className="bg-amber-600 px-4 py-2.5 flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-white shrink-0" />
        <p className="text-xs font-bold text-white uppercase tracking-widest flex-1">Outside Salvacion Jurisdiction</p>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${confidenceColor}`}>
          {confidence} confidence
        </span>
      </div>
      <div className="bg-amber-50 px-4 py-3 space-y-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              {detectedBarangay
                ? `${detectedBarangay}${detectedCity ? ', ' + detectedCity : ''}${detectedProvince ? ', ' + detectedProvince : ''}`
                : 'Unknown area — outside Salvacion boundaries'}
            </p>
            {reasoning && <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{reasoning}</p>}
          </div>
        </div>
        {contactSuggestion && (
          <div className="flex items-start gap-2 text-xs text-amber-900 bg-white border border-amber-200 rounded px-3 py-2">
            <Users className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>{contactSuggestion}</span>
          </div>
        )}
        <button
          onClick={handleShare}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-bold transition-all ${
            shareResult === 'shared' ? 'bg-green-600 text-white' :
            shareResult === 'copied' ? 'bg-slate-700 text-white' :
            shareResult === 'error'  ? 'bg-red-600 text-white'   :
            'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {shareResult === 'shared' ? <><CheckCircle className="w-4 h-4" />Shared Successfully!</> :
           shareResult === 'copied' ? <><CheckCircle className="w-4 h-4" />Copied to Clipboard</> :
           shareResult === 'error'  ? <><AlertCircle className="w-4 h-4" />Share Failed — Try Again</> :
           <><Share2 className="w-4 h-4" />Forward to Correct Barangay</>}
        </button>
        <p className="text-xs text-amber-600 text-center">Shares emergency details, GPS, and a Google Maps link</p>
      </div>
    </div>
  );
}


// ─── Dispatch Modal (3-step) ──────────────────────────────────────────────────
function DispatchModal({ isOpen, onClose, onDispatch, responders, emergencyType }) {
  const [selectedTeam,   setSelectedTeam]   = useState(() => suggestTeam(emergencyType));
  const [step,           setStep]           = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [deploying,      setDeploying]      = useState(false);

  useEffect(() => {
    if (isOpen) { setSelectedTeam(suggestTeam(emergencyType)); setStep(1); setSelectedLeadId(null); setDeploying(false); }
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

  const handleConfirmDeploy = async () => { setDeploying(true); await onDispatch(selectedTeam, selectedTeamData, selectedLeadId); setDeploying(false); };

  if (step === 1) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4" /> Dispatch Response Team</h2>
          <p className="text-slate-400 text-xs mt-0.5">Select a team to respond to this emergency</p>
          <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> AI recommends <strong className="text-white ml-1">{getTeamConfig(aiSuggestedTeam).label}</strong></p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Step 1 of 3 — Select team</p>
          {teamSummary.map(team => {
            const isSelected = selectedTeam === team.value;
            const isAiPick   = aiSuggestedTeam === team.value;
            const hasAvail   = team.available.length > 0;
            return (
              <button key={team.value} onClick={() => hasAvail && setSelectedTeam(team.value)} disabled={!hasAvail}
                className={`w-full flex items-center justify-between p-4 rounded border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${team.header} rounded flex items-center justify-center flex-shrink-0`}><Users className="w-5 h-5 text-white" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{team.label}</p>
                      {isAiPick && <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2 py-0.5 rounded font-semibold"><Bot className="w-3 h-3" /> AI Pick</span>}
                    </div>
                    <p className="text-xs text-slate-500">{team.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">{team.available.length} available</span>
                  {team.busy.length > 0 && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">{team.busy.length} busy</span>}
                  {!hasAvail && <span className="text-xs text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">Unavailable</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => { setSelectedLeadId(selectedTeamData?.available[0]?.id ?? null); setStep(2); }} disabled={!selectedTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40">
            <ArrowRight className="w-3.5 h-3.5" /> Next — Pick Lead
          </button>
        </div>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Radio className="w-4 h-4 text-slate-300" /> Pick Lead Responder</h2>
            <p className="text-slate-400 text-xs mt-0.5">{selectedTeamData?.label} — Step 2 of 3</p>
          </div>
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white p-1.5 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 font-medium">Select <strong>one member</strong> whose GPS will be tracked live on the map. All available members will be dispatched.</p>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Available — {selectedTeamData?.available.length} member{selectedTeamData?.available.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {selectedTeamData?.available.map(member => {
              const isSelected = selectedLeadId === member.id;
              const hasGPS     = member.current_lat && member.current_lng;
              return (
                <button key={member.id} onClick={() => setSelectedLeadId(member.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded border-2 transition-all text-left ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>{member.name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{member.name}</p>
                      <span className={`text-xs font-medium flex items-center gap-1 ${hasGPS ? 'text-green-600' : 'text-amber-600'}`}><MapPin className="w-3 h-3" /> {hasGPS ? 'GPS Active' : 'No GPS yet'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected && <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2.5 py-1 rounded-full font-bold"><Radio className="w-3 h-3" /> Lead</span>}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-slate-700 bg-slate-700' : 'border-slate-300 bg-white'}`}>{isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {!selectedLeadId && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2.5 mt-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Please select a lead responder to continue.</p>}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Back</button>
          <button onClick={() => setStep(3)} disabled={!selectedLeadId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40">
            <ArrowRight className="w-3.5 h-3.5" /> Next — Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Confirm Dispatch</h2>
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
                  <div className={`w-10 h-10 ${selectedTeamData.header} rounded flex items-center justify-center flex-shrink-0`}><Users className="w-5 h-5 text-white" /></div>
                  <div><p className="text-sm font-bold text-slate-900">{selectedTeamData.label}</p><p className="text-xs text-slate-500">{selectedTeamData.available.length} members will be dispatched</p></div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">All dispatched members</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTeamData.available.map(m => (
                      <span key={m.id} className={`text-xs px-2 py-0.5 rounded font-medium border ${m.id === selectedLeadId ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300'}`}>
                        {m.name}{m.id === selectedLeadId ? ' (Lead)' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedLead && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-blue-800">Live Tracking — {selectedLead.name}</p><p className="text-xs text-blue-600 mt-0.5">This person's GPS will be shown on the map</p></div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">This marks the emergency as <strong>Dispatched</strong> and sets all dispatched members to <strong>Busy</strong>. This action will be logged.</p>
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={() => setStep(2)} disabled={deploying} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors">Go Back</button>
          <button onClick={handleConfirmDeploy} disabled={deploying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {deploying ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Dispatching...</> : <><Send className="w-3.5 h-3.5" /> Yes, Dispatch Team</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Emergency Detail Modal ───────────────────────────────────────────────────
function EmergencyDetailModal({ emergency, onClose, onOpenDispatch, onResolve, onCallUser, onTrackResponder, onUserAction, jurisdictionResult, scanningJurisdiction }) {
  if (!emergency) return null;
  const isCancelled = emergency.status === 'cancelled';
  const reporter    = emergency.users ?? null;

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
              {isCancelled && <BanIcon className="w-4 h-4 text-slate-300" />}{emergency.type} Emergency
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SeverityBadge severity={emergency.severity ?? 'high'} />
              <StatusBadge status={emergency.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded border border-slate-600">
                <Clock className="w-3 h-3" /> {timeAgo(emergency.created_at)}
              </span>
              {reporter && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded border border-slate-600">
                  <ReporterAvatar user={reporter} size="sm" />{resolveReporterName(reporter)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {isCancelled && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-2">
            <BanIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-slate-500">This emergency was <span className="text-slate-700">cancelled by the reporter</span> as a false alarm. No action is required.</p>
          </div>
        )}

        <div className="p-6 space-y-4">
          <ReporterPanel user={reporter} onCallUser={onCallUser} emergency={emergency} isCancelled={isCancelled} onUserAction={onUserAction} />
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Incident Classification</p>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <EmergencyIcon type={emergency.type} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{emergency.type} Emergency</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(emergency.created_at).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
              </div>
              {!isCancelled && emergency.status === 'pending' && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold ${getTeamConfig(suggestTeam(emergency.type)).color}`}>
                  <Users className="w-3.5 h-3.5" />Recommended: {getTeamConfig(suggestTeam(emergency.type)).label}
                </div>
              )}
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Incident Description</p>
            </div>
            <div className="p-4"><p className="text-sm text-slate-700 leading-relaxed">{emergency.description}</p></div>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Location Information</p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">{emergency.location_text ?? 'GPS Coordinates Provided'}</p>
              <p className="text-xs text-slate-500 font-mono">{emergency.latitude?.toFixed(5)}, {emergency.longitude?.toFixed(5)}</p>
              <div className="flex gap-2 pt-1">
                <a href={`https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> Open in Maps
                </a>
              </div>
            </div>
          </div>
          <JurisdictionBanner jurisdictionResult={jurisdictionResult} scanning={scanningJurisdiction} incident={emergency} buildShareText={buildEmergencyShareText} />

          {emergency.status === 'dispatched' && emergency.assigned_team && (
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2"><Radio className="w-3.5 h-3.5" /> Dispatched Team</p>
                {emergency.responder_id && (
                  <button onClick={() => onTrackResponder(emergency)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors">
                    <Navigation className="w-3.5 h-3.5" /> Track Live
                  </button>
                )}
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${getTeamConfig(emergency.assigned_team).header} rounded flex items-center justify-center`}><Users className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{getTeamConfig(emergency.assigned_team).label}</p>
                  <p className="text-xs text-slate-500">{getTeamConfig(emergency.assigned_team).description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-lg flex-wrap">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
          {reporter && onUserAction && (
            <button onClick={() => onUserAction(reporter)} className="flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-semibold rounded transition-colors">
              <Flag className="w-4 h-4" /> Flag / Suspend Reporter
            </button>
          )}
          {emergency.status === 'pending' && !isCancelled && (
            <button onClick={() => onOpenDispatch(emergency)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors">
              <Radio className="w-4 h-4" /> Dispatch Response Team
            </button>
          )}
          {emergency.status === 'dispatched' && (
            <>
              {emergency.responder_id && (
                <button onClick={() => onTrackResponder(emergency)} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors">
                  <Navigation className="w-4 h-4" /> Track
                </button>
              )}
              <button onClick={() => onResolve(emergency.id, emergency.assigned_team)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded transition-colors">
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
  const [userActionModal,       setUserActionModal]       = useState(null);
  const [jurisdictionMap,       setJurisdictionMap]       = useState({});
  const [scanningJurisdictionId,setScanningJurisdictionId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: emData, error: emError } = await supabase.from('emergencies').select('*').order('created_at', { ascending: false });
      if (emError) throw emError;
      const userIds   = emData?.map(e => e.user_id).filter(Boolean) || [];
      const uniqueIds = [...new Set(userIds)];
      let usersMap = {};
      if (uniqueIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id,full_name,first_name,middle_name,last_name,email,phone,avatar_url,account_type,verification_status,purok,barangay,city,address,account_status').in('id', uniqueIds);
        usersMap = Object.fromEntries((usersData || []).map(u => [u.id, u]));
      }
      const emergenciesWithUsers = emData?.map(e => ({ ...e, users: usersMap[e.user_id] || null })) || [];
      const { data: resData } = await supabase.from('responders').select('*');
      setEmergencies(emergenciesWithUsers);
      if (resData) setResponders(resData);
    } catch (error) { console.error('fetchData error', error); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('admin-emergency-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, payload => {
        fetchData();
        if (payload.eventType === 'UPDATE') setSelectedEmergency(prev => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        if (payload.eventType === 'DELETE') setEmergencies(prev => prev.filter(e => e.id !== payload.old.id));
      })
      .subscribe(status => setRealtimeStatus(status === 'SUBSCRIBED' ? 'live' : 'error'));
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const handleOpenUserAction = (user) => { if (!user) return; setUserActionModal(user); };

  const handleJurisdictionCheck = async (emergency) => {
    if (!emergency.latitude || !emergency.longitude) return;
    setScanningJurisdictionId(emergency.id);
    try {
      const result = await analyzeJurisdiction({
        lat:          emergency.latitude,
        lng:          emergency.longitude,
        locationText: emergency.location_text || '',
      });
      if (result) {
        setJurisdictionMap(prev => ({ ...prev, [emergency.id]: result }));
        if (result.isOutside) {
          setEmergencies(prev => prev.map(e => e.id === emergency.id ? { ...e, _outsideSalvacion: true } : e));
        }
      }
    } catch (err) {
      console.error('Jurisdiction check error:', err);
    } finally {
      setScanningJurisdictionId(null);
    }
  };

  const handleStartCall = async (emergency) => {
    await supabase.from('emergencies').update({ call_status: 'calling' }).eq('id', emergency.id);
    setActiveCallId(emergency.id);
    setIsCallOpen(true);
    setSelectedEmergency(null);
  };

  const openDispatchModal = (emergency) => { setEmergencyToDispatch(emergency); setIsDispatchOpen(true); };

  const handleDispatch = async (teamValue, teamData, leadResponderId) => {
    if (!emergencyToDispatch) return;
    try {
      const availableMembers = teamData.available ?? [];
      const memberNames      = availableMembers.map(m => m.name).join(', ');
      const leadResponder    = availableMembers.find(m => m.id === leadResponderId);
      if (availableMembers.length > 0) await supabase.from('responders').update({ status: 'busy' }).in('id', availableMembers.map(m => m.id));
      await supabase.from('emergencies').update({ status: 'dispatched', assigned_team: teamValue, responder_id: leadResponderId ?? availableMembers[0]?.id ?? null, responder_status: 'dispatched' }).eq('id', emergencyToDispatch.id);
      try {
        await logAuditAction({ action:'deploy', actionType:'emergency', description:`Dispatched ${teamData.label} to ${emergencyToDispatch.type} emergency. Lead: ${leadResponder?.name ?? 'N/A'}. Members: ${memberNames}.`, severity:'critical', targetId:emergencyToDispatch.id, targetType:'emergency', targetName:`${emergencyToDispatch.type} Emergency`, newValues:{ team:teamValue, teamLabel:teamData.label, lead:leadResponder?.name??null, leadId:leadResponderId??null, membersDeployed:availableMembers.length, memberNames } });
      } catch (auditErr) { console.error('Audit log failed:', auditErr); }
      setIsDispatchOpen(false); setEmergencyToDispatch(null); setSelectedEmergency(null); fetchData();
    } catch (err) { console.error('handleDispatch error:', err); alert('Dispatch failed. Please try again.'); }
  };

  const handleTrackResponder = async (emergency) => {
    if (!emergency) return;
    const leadId = emergency.responder_id;
    if (leadId) {
      const { data: responder } = await supabase.from('responders').select('*').eq('id', leadId).single();
      if (responder) { setTrackingEmergency(emergency); setTrackingResponder(responder); setTrackingModalOpen(true); return; }
    }
    const fallback = responders.find(r => r.status==='busy' && r.team===emergency.assigned_team) ?? responders.find(r => r.status==='busy');
    if (!fallback) { alert('No active responder found. The responder may not have GPS enabled yet.'); return; }
    setTrackingEmergency(emergency); setTrackingResponder(fallback); setTrackingModalOpen(true);
  };

  const handleResolve = async (emergencyId, assignedTeam) => {
    if (!confirm('Confirm resolution of this emergency?')) return;
    try {
      await supabase.from('emergencies').update({ status: 'resolved' }).eq('id', emergencyId);
      if (assignedTeam) {
        const teamMembers = responders.filter(r => r.team === assignedTeam && r.status === 'busy');
        if (teamMembers.length > 0) await supabase.from('responders').update({ status: 'available' }).in('id', teamMembers.map(m => m.id));
      }
      try { await logAuditAction({ action:'resolve', actionType:'emergency', description:`Resolved emergency. Team ${assignedTeam?getTeamConfig(assignedTeam).label:'N/A'} freed.`, severity:'info', targetId:emergencyId, targetType:'emergency', targetName:'Emergency' }); } catch {}
      setSelectedEmergency(null); fetchData();
    } catch (err) { console.error('Resolve error:', err); alert('Failed to resolve. Please try again.'); }
  };

  const filteredEmergencies = emergencies.filter(e => filterStatus === 'All' ? e.status !== 'cancelled' : e.status === filterStatus);
  const stats = { total:emergencies.length, pending:emergencies.filter(e=>e.status==='pending').length, dispatched:emergencies.filter(e=>e.status==='dispatched').length, resolved:emergencies.filter(e=>e.status==='resolved').length, cancelled:emergencies.filter(e=>e.status==='cancelled').length };
  const borderColor = { pending:'border-l-red-500', dispatched:'border-l-blue-500', resolved:'border-l-green-500', cancelled:'border-l-slate-300' };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Emergency Operations</div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and dispatch responses to active emergency alerts in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold ${realtimeStatus==='live' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${realtimeStatus==='live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {realtimeStatus==='live' ? 'Realtime Live' : 'Realtime Error'}
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:'Total',      value:stats.total,      icon:FileText,      color:'text-slate-700' },
          { label:'Pending',    value:stats.pending,    icon:AlertTriangle, color:'text-red-600'   },
          { label:'Dispatched', value:stats.dispatched, icon:Radio,         color:'text-blue-600'  },
          { label:'Resolved',   value:stats.resolved,   icon:CheckCircle,   color:'text-green-600' },
          { label:'Cancelled',  value:stats.cancelled,  icon:BanIcon,       color:'text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p><p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p></div>
              <Icon className={`w-5 h-5 ${color} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

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
          <span className="text-xs text-slate-400 ml-auto">Showing <strong className="text-slate-600">{filteredEmergencies.length}</strong> of <strong className="text-slate-600">{emergencies.length}</strong> incidents</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-lg">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading emergency records...</span>
        </div>
      ) : filteredEmergencies.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No emergency records found</p>
          <p className="text-sm text-slate-400 mt-1">{filterStatus === 'All' ? 'No active emergencies. Cancelled records are hidden — use the filter to view them.' : 'Adjust your filter or check back later.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmergencies.map(emergency => {
            const isCancelled = emergency.status === 'cancelled';
            const teamCfg     = emergency.assigned_team ? getTeamConfig(emergency.assigned_team) : null;
            const reporter    = emergency.users ?? null;
            return (
              <div key={emergency.id} className={`bg-white border border-slate-200 border-l-4 rounded-lg shadow-sm transition-all ${borderColor[emergency.status] ?? 'border-l-slate-300'} ${isCancelled ? 'opacity-60' : 'hover:shadow-md'}`}>
                {emergency.status === 'dispatched' && emergency.responder_id && (
                  <div className="bg-slate-700 px-4 py-1.5 flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider"><Radio className="w-3.5 h-3.5" /> Responder Dispatched</div>
                    <button onClick={e => { e.stopPropagation(); handleTrackResponder(emergency); }}
                      className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Track Live
                    </button>
                  </div>
                )}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <EmergencyIcon type={emergency.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-bold text-sm ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{emergency.type} Emergency</h3>
                        <StatusBadge status={emergency.status} />
                        {emergency.severity && !isCancelled && <SeverityBadge severity={emergency.severity} />}
                        {isCancelled && <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium"><BanIcon className="w-3 h-3" /> False alarm</span>}
                        {teamCfg && emergency.status === 'dispatched' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${teamCfg.color}`}><Users className="w-3 h-3" /> {teamCfg.label}</span>
                        )}
                        {emergency._outsideSalvacion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold bg-amber-50 text-amber-700 border-amber-300">
                            <AlertTriangle className="w-3 h-3" />Outside Salvacion
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">{emergency.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emergency.location_text ?? 'GPS Location'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(emergency.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}</span>
                        <span className="font-mono text-slate-300">{emergency.id.slice(0, 8).toUpperCase()}</span>
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <ReporterAvatar user={reporter} size="sm" />{resolveReporterName(reporter)}
                          {reporter?.phone && <span className="text-slate-400 font-normal">· {reporter.phone}</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => {
                        setSelectedEmergency(emergency);
                        if (emergency.latitude && emergency.longitude && !jurisdictionMap[emergency.id]) {
                          handleJurisdictionCheck(emergency);
                        }
                      }} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"><Eye className="w-3.5 h-3.5" /> View</button>
                    {emergency.status === 'pending' && <button onClick={() => openDispatchModal(emergency)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"><Radio className="w-3.5 h-3.5" /> Dispatch</button>}
                    {emergency.status === 'dispatched' && <button onClick={() => handleResolve(emergency.id, emergency.assigned_team)} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded text-xs font-semibold hover:bg-green-100 transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Resolve</button>}
                    {reporter && <button onClick={e => { e.stopPropagation(); handleOpenUserAction(reporter); }} className="flex items-center gap-1.5 px-3 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded text-xs font-semibold hover:bg-amber-100 transition-colors" title="Flag Reporter"><Flag className="w-3.5 h-3.5" /> Flag</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmergencyDetailModal emergency={selectedEmergency} onClose={() => setSelectedEmergency(null)}
        onOpenDispatch={(e) => { openDispatchModal(e); setSelectedEmergency(null); }}
        onResolve={handleResolve} onCallUser={handleStartCall} onTrackResponder={handleTrackResponder} onUserAction={handleOpenUserAction}
        jurisdictionResult={selectedEmergency ? (jurisdictionMap[selectedEmergency.id] || null) : null}
        scanningJurisdiction={selectedEmergency ? scanningJurisdictionId === selectedEmergency.id : false} />
      <DispatchModal isOpen={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} onDispatch={handleDispatch} responders={responders} emergencyType={emergencyToDispatch?.type} />
      {trackingModalOpen && trackingEmergency && trackingResponder && (
        <TrackResponderModal emergency={trackingEmergency} responder={trackingResponder}
          onClose={() => { setTrackingModalOpen(false); setTrackingEmergency(null); setTrackingResponder(null); }} />
      )}
      <CallModal isOpen={isCallOpen} emergencyId={activeCallId} onClose={() => { setIsCallOpen(false); setActiveCallId(null); }} />
      {userActionModal && <UserActionModal user={userActionModal} onClose={() => setUserActionModal(null)} onSuccess={fetchData} />}
    </div>
  );
}