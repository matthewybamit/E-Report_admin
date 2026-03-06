// src/components/EmergencyTrackModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Radio, Users, MapPin, Clock, Navigation, CheckCircle, Loader } from 'lucide-react';

// Fix default Leaflet icon paths (Vite breaks them otherwise)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const responderIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const destinationIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const RESPONSE_TEAMS = [
  { value: 'bpso',     label: 'BPSO Team',             header: 'bg-blue-700',   color: 'bg-blue-50 text-blue-700 border-blue-300'     },
  { value: 'disaster', label: 'Disaster Response Team', header: 'bg-orange-700', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'bhert',    label: 'BHERT',                  header: 'bg-green-700',  color: 'bg-green-50 text-green-700 border-green-300'   },
  { value: 'general',  label: 'General Response',       header: 'bg-slate-600',  color: 'bg-slate-50 text-slate-700 border-slate-300'   },
];
const getTeamConfig = (team) => RESPONSE_TEAMS.find(t => t.value === team) ?? RESPONSE_TEAMS[3];

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

export default function EmergencyTrackModal({ emergency, responder, onClose }) {
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderStatus,   setResponderStatus]   = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [distance,          setDistance]          = useState(null);

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

  useEffect(() => {
    if (!responderId || !emergencyId) return;

    (async () => {
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
      } finally {
        setLoading(false);
      }
    })();

    // Realtime: responder GPS moves
    const ch1 = supabase
      .channel(`em-track-resp-${responderId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responders', filter: `id=eq.${responderId}` }, ({ new: n }) => {
        if (n.current_lat && n.current_lng) {
          setResponderLocation({ lat: n.current_lat, lng: n.current_lng });
          calcDistance(n.current_lat, n.current_lng, emergencyLat, emergencyLng);
        }
      }).subscribe();

    // Realtime: emergency responder_status changes
    const ch2 = supabase
      .channel(`em-track-status-${emergencyId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emergencies', filter: `id=eq.${emergencyId}` }, ({ new: n }) => {
        setResponderStatus(n.responder_status);
      }).subscribe();

    // 8-second GPS poll fallback
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
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Status',   value: responderStatus ? (statusLabel[responderStatus] ?? responderStatus) : 'Dispatched' },
                  { label: 'Distance', value: distance ? `${distance} km away` : (emergencyLat ? 'Calculating...' : 'No coords') },
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
                {responderLocation && emergencyLat && emergencyLng ? (
                  <MapContainer center={[responderLocation.lat, responderLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
                      <Popup><strong>{responder.name}</strong><br /><span className="text-xs">Current Location</span></Popup>
                    </Marker>
                    <Marker position={[emergencyLat, emergencyLng]} icon={destinationIcon}>
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
                ) : (
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
                )}
              </div>

              {/* Timeline */}
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
                          ${s === responderStatus ? 'text-slate-800' : curStep > idx ? 'text-green-700' : 'text-slate-400'}`}>
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

              {/* Directions link */}
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
