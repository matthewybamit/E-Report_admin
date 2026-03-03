// src/pages/Reports.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import Groq from 'groq-sdk';
import {
  Search, Eye, Edit3, Trash2, X, FileText, MapPin, Clock, User, RefreshCw,
  Phone, Mail, MessageSquare, CheckCircle, AlertCircle, XCircle, Wrench,
  Heart, Shield, Leaf, AlertTriangle, Send, Bot, Loader, Zap, Bell,
  Navigation, Radio, Video, Images, ChevronDown, ChevronUp, Maximize2,
  Award, Flag, Clock3, Users, BarChart2,
} from 'lucide-react';
import { logAuditAction } from '../utils/auditLogger';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const responderIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41],
});
const destinationIcon = new L.Icon({
  iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41],
});

function MapUpdater({ responderLocation, reportLocation }) {
  const map = useMap();
  useEffect(() => {
    if (responderLocation && reportLocation) {
      const bounds = L.latLngBounds(
        [responderLocation.lat, responderLocation.lng],
        [reportLocation.lat,    reportLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [responderLocation, reportLocation, map]);
  return null;
}

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ─── Team config (must match AdminManagement) ──────────────────────────────
const RESPONSE_TEAMS = [
  { value: 'bpso',     label: 'BPSO Team',             description: 'Barangay Public Safety Officers',          header: 'bg-blue-700',   color: 'bg-blue-50 text-blue-700 border-blue-300'   },
  { value: 'disaster', label: 'Disaster Response Team', description: 'Emergency & disaster operations',           header: 'bg-orange-700', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'bhert',    label: 'BHERT',                  description: 'Barangay Health Emergency Response Team',   header: 'bg-green-700',  color: 'bg-green-50 text-green-700 border-green-300' },
  { value: 'general',  label: 'General Response',       description: 'Multi-purpose barangay responders',         header: 'bg-slate-600',  color: 'bg-slate-50 text-slate-700 border-slate-300' },
];

const getTeamConfig = (team) =>
  RESPONSE_TEAMS.find(t => t.value === team) || RESPONSE_TEAMS[3];

// ─── AI ───────────────────────────────────────────────────────────────────────
async function analyzeReportWithAI(reportData) {
  const { category, title, description, location } = reportData;
  const prompt = `You are an AI assistant for a barangay (local government) reporting system. Analyze this citizen report and provide a structured assessment.

Report Details:
- Category: ${category}
- Title: ${title}
- Description: ${description}
- Location: ${location}

Respond in valid JSON format only:
{
  "priority": "medium",
  "severity": 7,
  "responseTime": 2,
  "suggestedActions": ["Action 1", "Action 2", "Action 3"],
  "suggestedTeam": "bpso",
  "reasoning": "One sentence explanation."
}

Priority: low | medium | high | urgent
Severity: 1-10
ResponseTime: hours
SuggestedTeam: bpso | disaster | bhert | general`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 400,
    });
    const text  = completion.choices[0]?.message?.content || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch (err) {
    console.error('Groq AI Error:', err);
    return null;
  }
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    pending:      { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', icon: AlertCircle, label: 'Pending'     },
    'in-progress':{ bg: 'bg-blue-50',  text: 'text-blue-800',  border: 'border-blue-300',  icon: Loader,      label: 'In Progress' },
    resolved:     { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', icon: CheckCircle, label: 'Resolved'    },
    rejected:     { bg: 'bg-red-50',   text: 'text-red-800',   border: 'border-red-300',   icon: XCircle,     label: 'Rejected'    },
  };
  const s = config[status] || config.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${s.bg} ${s.text} ${s.border} tracking-wide`}>
      <Icon className="w-3 h-3 mr-1.5" />{s.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    low:    { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    medium: { bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-300' },
    high:   { bg: 'bg-orange-50', text: 'text-orange-700',border: 'border-orange-300'},
    urgent: { bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-400'   },
  };
  const s = config[priority] || config.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${s.bg} ${s.text} ${s.border} tracking-wide uppercase`}>
      <Flag className="w-3 h-3 mr-1.5" />{priority || 'Medium'}
    </span>
  );
}

function ResponderStatusBadge({ status, reportStatus }) {
  if (reportStatus === 'resolved' || !status) return null;
  const config = {
    assigned:   { bg: 'bg-blue-50',   text: 'text-blue-800',   icon: Send,        label: 'Assigned'   },
    en_route:   { bg: 'bg-orange-50', text: 'text-orange-800', icon: Navigation,  label: 'En Route'   },
    on_scene:   { bg: 'bg-green-50',  text: 'text-green-800',  icon: MapPin,      label: 'On Scene'   },
    completing: { bg: 'bg-purple-50', text: 'text-purple-800', icon: CheckCircle, label: 'Completing' },
  };
  const s = config[status] || config.assigned;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${s.bg} ${s.text} border border-current/20 tracking-wide`}>
      <Icon className="w-3 h-3 mr-1.5" />{s.label}
    </span>
  );
}

// ─── AI Assessment Panel ──────────────────────────────────────────────────────
function AIAssessmentPanel({ aiData, onAccept, onDismiss, accepting, scanning, onRunAssessment, canRun }) {
  const [expanded, setExpanded] = useState(true);

  const verdictConfig = {
    likely_real: { label: 'Likely Genuine', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', dot: 'bg-green-500' },
    genuine:     { label: 'Genuine',        color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', dot: 'bg-green-500' },
    uncertain:   { label: 'Uncertain',      color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500' },
    suspicious:  { label: 'Suspicious',     color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-300',   dot: 'bg-red-500'   },
  };

  const verdict = verdictConfig[aiData?.fraud?.verdict] || verdictConfig.uncertain;
  const hasData = !!(aiData?.priority || aiData?.fraud);
  const suggestedTeam = aiData?.suggestedTeam ? getTeamConfig(aiData.suggestedTeam) : null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-slate-300" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">AI-Assisted Assessment</span>
          {hasData && <span className="text-xs bg-slate-500 text-slate-200 px-2 py-0.5 rounded font-medium">Results Available</span>}
        </div>
        <div className="flex items-center gap-2">
          {canRun && (
            <button onClick={onRunAssessment} disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors border border-slate-500">
              {scanning
                ? <><Loader className="w-3.5 h-3.5 animate-spin" />Processing...</>
                : <><BarChart2 className="w-3.5 h-3.5" />Run Full Assessment</>
              }
            </button>
          )}
          {hasData && (
            <button onClick={() => setExpanded(p => !p)} className="text-slate-400 hover:text-slate-200 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {!hasData && !scanning && (
        <div className="bg-slate-50 px-5 py-6 text-center border-t border-slate-200">
          <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No assessment has been run for this report.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Run Full Assessment" to analyze priority and verify evidence integrity.</p>
        </div>
      )}

      {scanning && (
        <div className="bg-slate-50 px-5 py-8 flex flex-col items-center justify-center border-t border-slate-200 gap-3">
          <Loader className="w-7 h-7 text-slate-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Assessment in Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">Running priority analysis and evidence verification simultaneously...</p>
          </div>
        </div>
      )}

      {hasData && expanded && (
        <div className="bg-white border-t border-slate-200 divide-y divide-slate-100">
          {aiData.priority && (
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Priority Assessment</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Classification', value: aiData.priority,     extra: '',     bold: true  },
                  { label: 'Severity',        value: aiData.severity,     extra: '/10',  bold: false },
                  { label: 'Response Time',   value: aiData.responseTime, extra: ' hrs', bold: false },
                  { label: 'Suggested Team',  value: suggestedTeam?.label || aiData.suggestedTeam || '—', extra: '', bold: false },
                ].map(({ label, value, extra, bold }) => (
                  <div key={label} className="bg-slate-50 border border-slate-200 rounded p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
                    <p className={`text-sm font-bold text-slate-800 ${bold ? 'uppercase' : ''}`}>
                      {value}<span className="text-xs font-normal text-slate-500">{extra}</span>
                    </p>
                  </div>
                ))}
              </div>
              {suggestedTeam && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold mb-3 ${suggestedTeam.color}`}>
                  <Users className="w-3.5 h-3.5" />AI recommends: {suggestedTeam.label} — {suggestedTeam.description}
                </div>
              )}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">AI Reasoning</p>
                <p className="text-sm text-slate-700 leading-relaxed">{aiData.reasoning}</p>
              </div>
              {aiData.suggestedActions?.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recommended Actions</p>
                  <ol className="space-y-1.5">
                    {aiData.suggestedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="flex-shrink-0 w-5 h-5 bg-slate-200 text-slate-600 rounded text-xs font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {aiData.fraud && (
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Evidence Integrity Verification</p>
              <div className={`rounded border ${verdict.bg} ${verdict.border} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${verdict.dot} flex-shrink-0`} />
                    <span className={`text-sm font-bold ${verdict.color} uppercase tracking-wide`}>{verdict.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Confidence: {aiData.fraud.score != null ? `${Math.round(aiData.fraud.score * 100)}%` : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{aiData.fraud.explanation}</p>
                <p className="text-xs text-slate-400 mt-2 border-t border-current/10 pt-2">
                  Advisory only — this is an automated assessment. Human review is required before taking action.
                </p>
              </div>
            </div>
          )}

          {aiData.priority && (
            <div className="px-5 py-4 bg-slate-50 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Accepting will update this report's priority to <strong className="text-slate-700 uppercase">{aiData.priority}</strong> and save the assessment notes.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={onDismiss}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors">
                  Dismiss
                </button>
                <button onClick={onAccept} disabled={accepting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5">
                  {accepting ? <><Loader className="w-3.5 h-3.5 animate-spin" />Applying...</> : <><CheckCircle className="w-3.5 h-3.5" />Accept Recommendations</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Track Responder Modal ────────────────────────────────────────────────────
function TrackResponderModal({ report, responder, onClose }) {
  const [responderLocation, setResponderLocation] = useState(null);
  const [responderStatus,   setResponderStatus]   = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [distance,          setDistance]          = useState(null);

  useEffect(() => {
    if (!responder) return;
    fetchResponderLocation();
    const ch1 = supabase.channel(`responder-tracking-${responder.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responders', filter: `id=eq.${responder.id}` },
        payload => {
          if (payload.new.current_lat && payload.new.current_lng) {
            setResponderLocation({ lat: payload.new.current_lat, lng: payload.new.current_lng });
            calcDistance(payload.new.current_lat, payload.new.current_lng, report.latitude, report.longitude);
          }
        }).subscribe();
    const ch2 = supabase.channel(`job-status-${report.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${report.id}` },
        payload => setResponderStatus(payload.new.responder_status)).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [responder, report]);

  const fetchResponderLocation = async () => {
    try {
      const { data } = await supabase.from('responders').select('current_lat, current_lng').eq('id', responder.id).single();
      if (data?.current_lat && data?.current_lng) {
        setResponderLocation({ lat: data.current_lat, lng: data.current_lng });
        calcDistance(data.current_lat, data.current_lng, report.latitude, report.longitude);
      }
      const { data: job } = await supabase.from('reports').select('responder_status').eq('id', report.id).single();
      if (job) setResponderStatus(job.responder_status);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
  };

  const statusLabel = { assigned: 'Assigned', en_route: 'En Route', on_scene: 'On Scene', completing: 'Completing' };
  const steps       = ['assigned', 'en_route', 'on_scene', 'completing'];
  const curStep     = steps.indexOf(responderStatus);
  const teamCfg     = getTeamConfig(responder.team || 'bpso');

  if (!responder) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-300 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Live Responder Tracking</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {responder.name}
              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${teamCfg.color}`}>
                <Users className="w-3 h-3" />{teamCfg.label}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 text-slate-400 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Status',   value: responderStatus ? (statusLabel[responderStatus] || 'Unknown') : 'Unknown' },
                  { label: 'Distance', value: distance ? `${distance} km` : 'Calculating...' },
                  { label: 'Location', value: responderLocation ? 'Live Feed Active' : 'Offline' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-200 rounded p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 rounded overflow-hidden h-80">
                {responderLocation && report.latitude && report.longitude ? (
                  <MapContainer center={[responderLocation.lat, responderLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
                      <Popup><strong>{responder.name}</strong><br /><span className="text-xs">Current Location</span></Popup>
                    </Marker>
                    <Marker position={[report.latitude, report.longitude]} icon={destinationIcon}>
                      <Popup><strong>Destination</strong><br /><span className="text-xs">{report.title}</span></Popup>
                    </Marker>
                    <Polyline positions={[[responderLocation.lat, responderLocation.lng],[report.latitude, report.longitude]]} pathOptions={{ color: '#475569', weight: 3, dashArray: '8, 8' }} />
                    <MapUpdater responderLocation={responderLocation} reportLocation={{ lat: report.latitude, lng: report.longitude }} />
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50">
                    <div className="text-center"><MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-sm">Location unavailable</p></div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Response Timeline</p>
                <div className="flex items-center gap-2">
                  {steps.map((s, idx) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          s === responderStatus ? 'bg-slate-700 text-white border-slate-700' :
                          curStep > idx ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-400 border-slate-300'
                        }`}>{curStep > idx ? '✓' : idx + 1}</div>
                        <p className={`text-xs font-medium text-center ${
                          s === responderStatus ? 'text-slate-800' : curStep > idx ? 'text-green-700' : 'text-slate-400'
                        }`}>{statusLabel[s]}</p>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`h-0.5 flex-1 mb-4 ${curStep > idx ? 'bg-green-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {responderLocation && (
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${responderLocation.lat},${responderLocation.lng}&destination=${report.latitude},${report.longitude}&travelmode=driving`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors">
                  <Navigation className="w-4 h-4" />Open Turn-by-Turn Directions
                </a>
              )}
            </>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
          <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Deploy Team Modal (NEW: team-based + confirmation step) ──────────────────
function DeployTeamModal({ report, responders, onClose, onDeploy, aiSuggestedTeam }) {
  const [selectedTeam,    setSelectedTeam]    = useState(aiSuggestedTeam || null);
  const [confirming,      setConfirming]      = useState(false);   // confirmation step
  const [deploying,       setDeploying]       = useState(false);

  if (!report) return null;

  // Group available responders by team
  const teamSummary = RESPONSE_TEAMS.map(team => {
    const members   = responders.filter(r => (r.team || 'bpso') === team.value);
    const available = members.filter(r => r.status === 'available');
    const busy      = members.filter(r => r.status === 'busy');
    return { ...team, members, available, busy };
  });

  const selectedTeamData = teamSummary.find(t => t.value === selectedTeam);

  const handleConfirmDeploy = async () => {
    setDeploying(true);
    await onDeploy(selectedTeam, selectedTeamData);
    setDeploying(false);
  };

  // ── Step 1: Team Selection ──
  if (!confirming) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">

          <div className="bg-slate-800 px-6 py-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Send className="w-4 h-4" />Dispatch Response Team
            </h2>
            <p className="text-slate-400 text-xs mt-1">{report.report_number} — {report.title}</p>
            {aiSuggestedTeam && (
              <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                AI recommends: <strong className="text-white ml-1">{getTeamConfig(aiSuggestedTeam).label}</strong>
              </p>
            )}
          </div>

          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Select a team to dispatch:</p>
            {teamSummary.map(team => {
              const isSelected   = selectedTeam === team.value;
              const isAiPick     = aiSuggestedTeam === team.value;
              const hasAvailable = team.available.length > 0;
              return (
                <button
                  key={team.value}
                  onClick={() => hasAvailable && setSelectedTeam(team.value)}
                  disabled={!hasAvailable}
                  className={`w-full flex items-center justify-between p-4 rounded border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-400 bg-white'
                  }`}
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
                            <Bot className="w-3 h-3" />AI Pick
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{team.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">
                      {team.available.length} available
                    </span>
                    {team.busy.length > 0 && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                        {team.busy.length} busy
                      </span>
                    )}
                    {!hasAvailable && (
                      <span className="text-xs text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => setConfirming(true)}
              disabled={!selectedTeam}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />Next: Confirm Dispatch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Confirmation ──
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">

        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />Confirm Dispatch
            </h2>
            <p className="text-slate-400 text-xs mt-1">Review before sending</p>
          </div>
          <button onClick={() => setConfirming(false)} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Report Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Report</p>
            <p className="text-sm font-bold text-slate-900">{report.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{report.report_number} · {report.location || 'No location'}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>
          </div>

          {/* Team Summary */}
          <div className={`border-2 rounded-lg p-4 ${selectedTeamData ? 'border-slate-700 bg-slate-50' : 'border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Team to Dispatch</p>
            {selectedTeamData && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${selectedTeamData.header} rounded flex items-center justify-center`}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedTeamData.label}</p>
                    <p className="text-xs text-slate-500">{selectedTeamData.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-1 rounded">
                    {selectedTeamData.available.length} available members
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    {selectedTeamData.members.length} total members
                  </span>
                </div>
                {selectedTeamData.available.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">Available members:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeamData.available.map(m => (
                        <span key={m.id} className="text-xs bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              This will mark the report as <strong>In Progress</strong> and set all available members of this team to <strong>Busy</strong>. This action will be logged.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={() => setConfirming(false)} disabled={deploying}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
            ← Go Back
          </button>
          <button onClick={handleConfirmDeploy} disabled={deploying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {deploying
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Dispatching...</>
              : <><Send className="w-3.5 h-3.5" />Yes, Dispatch Team</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onView, onEdit, onDelete, canEdit, aiInsights, onTrackResponder }) {
  const categoryIcons = {
    infrastructure: { icon: Wrench,        label: 'Infrastructure' },
    health:         { icon: Heart,         label: 'Health'         },
    security:       { icon: Shield,        label: 'Security'       },
    environment:    { icon: Leaf,          label: 'Environment'    },
    sanitation:     { icon: AlertTriangle, label: 'Sanitation'     },
    noise:          { icon: AlertCircle,   label: 'Noise'          },
    waste:          { icon: Leaf,          label: 'Waste'          },
    streetlights:   { icon: Zap,           label: 'Streetlights'   },
    other:          { icon: FileText,      label: 'Other'          },
  };
  const catCfg     = categoryIcons[report.category] || categoryIcons.other;
  const CatIcon    = catCfg.icon;
  const isUrgent   = report.priority === 'urgent';
  const isInProgress = report.status === 'in-progress';
  const hasFraudAI = !!report.ai_verdict;
  const verdictColor = {
    likely_real: 'bg-green-50 text-green-700 border-green-200',
    genuine:     'bg-green-50 text-green-700 border-green-200',
    uncertain:   'bg-amber-50 text-amber-700 border-amber-200',
    suspicious:  'bg-red-50 text-red-700 border-red-200',
  }[report.ai_verdict] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-all hover:shadow-md ${isUrgent ? 'border-red-300 shadow-red-100' : 'border-slate-200'}`}>
      {isUrgent && (
        <div className="bg-red-600 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />Urgent Priority
          </div>
          <Bell className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      {isInProgress && (
        <div className="bg-slate-700 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />Responder Deployed
          </div>
          <button onClick={e => { e.stopPropagation(); onTrackResponder(report); }}
            className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1">
            <Navigation className="w-3 h-3" />Track
          </button>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500 font-mono">{report.report_number}</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-2 leading-snug">{report.title}</h3>
          </div>
          <div className="bg-slate-100 p-1.5 rounded flex-shrink-0 ml-2">
            <CatIcon className="w-4 h-4 text-slate-600" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded capitalize border border-slate-200">{catCfg.label}</span>
          <PriorityBadge priority={report.priority} />
          <StatusBadge status={report.status} />
          {report.responder_status && <ResponderStatusBadge status={report.responder_status} reportStatus={report.status} />}
        </div>
        {hasFraudAI && (
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold mb-3 ${verdictColor}`}>
            <Bot className="w-3 h-3" />Evidence: {report.ai_verdict?.replace(/_/g, ' ')}
            {report.ai_score != null && <span className="opacity-70">{Math.round(report.ai_score * 100)}%</span>}
          </div>
        )}
        {aiInsights && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 mb-3 ml-1">
            <BarChart2 className="w-3 h-3" />AI: {aiInsights.priority} priority
          </div>
        )}
        <div className="space-y-1 pt-2 border-t border-slate-100 mb-3">
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
            <span className="line-clamp-1">{report.location || 'No location provided'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
            {report.reporter_name?.charAt(0)?.toUpperCase()}
          </div>
          {report.reporter_name}
        </div>
        <div className="flex items-center gap-2 pt-3">
          <button onClick={() => onView(report)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors">
            <Eye className="w-3.5 h-3.5" />View Details
          </button>
          {canEdit && (
            <>
              <button onClick={() => onEdit(report)} className="p-2 text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors" title="Edit">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(report)} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View Report Modal ────────────────────────────────────────────────────────
function ViewReportModal({ report, onClose, onEditStatus, canEdit, onDeployResponder, onRunAssessment, scanning, aiData, onAcceptAI, acceptingAI, onDismissAI }) {
  const [isImageZoomed,  setIsImageZoomed]  = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  if (!report) return null;
  const imageUrls = Array.isArray(report.media_urls) ? report.media_urls : [];
  const hasImages = imageUrls.length > 0;
  const hasVideo  = !!report.video_url;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">

        {/* Header */}
        <div className="sticky top-0 bg-slate-800 px-6 py-4 z-10 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400 font-mono">{report.report_number}</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">{report.category}</span>
              </div>
              <h2 className="text-lg font-bold text-white leading-snug">{report.title}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
                {report.responder_status && report.status !== 'resolved' && (
                  <ResponderStatusBadge status={report.responder_status} reportStatus={report.status} />
                )}
                {(hasImages || hasVideo) && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded border border-slate-600">
                    {hasVideo ? <Video className="w-3 h-3" /> : <Images className="w-3 h-3" />}
                    {imageUrls.length + (hasVideo ? 1 : 0)} file{imageUrls.length + (hasVideo ? 1 : 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <AIAssessmentPanel
            aiData={aiData}
            onAccept={() => onAcceptAI(report.id)}
            onDismiss={onDismissAI}
            accepting={acceptingAI}
            scanning={scanning}
            onRunAssessment={() => onRunAssessment(report)}
            canRun={canEdit}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Reporter */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />Reporter Information
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Full Name</p><p className="text-sm font-semibold text-slate-800">{report.reporter_name}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Contact Number</p>
                  <a href={`tel:${report.reporter_phone}`} className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{report.reporter_phone || 'N/A'}</a>
                </div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Email Address</p>
                  <a href={`mailto:${report.reporter_email}`} className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{report.reporter_email}</a>
                </div>
              </div>
            </div>
            {/* Incident */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />Incident Details
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Classification</p><p className="text-sm font-semibold text-slate-800 capitalize">{report.category}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date Filed</p>
                  <p className="text-sm text-slate-700">{new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Description</p><p className="text-sm text-slate-700 leading-relaxed">{report.description}</p></div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Location Information
              </p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Address</p><p className="text-sm text-slate-800">{report.location || 'Not provided'}</p></div>
              <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Landmark</p><p className="text-sm text-slate-800">{report.landmark || 'Not provided'}</p></div>
              {report.latitude && report.longitude && (
                <div className="md:col-span-2">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors">
                    <MapPin className="w-3.5 h-3.5" />View on Map
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Evidence */}
          {(hasImages || hasVideo) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Images className="w-3.5 h-3.5" />Submitted Evidence
                  <span className="text-slate-400 font-normal">{imageUrls.length + (hasVideo ? 1 : 0)} file{imageUrls.length + (hasVideo ? 1 : 0) !== 1 ? 's' : ''}</span>
                </p>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Maximize2 className="w-3 h-3" />Click to enlarge</span>
              </div>
              <div className="p-4 space-y-3">
                {hasImages && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} onClick={() => { setZoomedImageUrl(url); setIsImageZoomed(true); }}
                        className="relative aspect-square cursor-zoom-in overflow-hidden rounded border border-slate-200 hover:border-slate-400 transition-all group bg-slate-50">
                        <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded font-mono">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                {hasVideo && (
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <video src={report.video_url} controls className="w-full max-h-64 bg-black" preload="metadata">Your browser does not support video.</video>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {(report.assigned_to || report.admin_notes) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />Administrative Notes
                </p>
              </div>
              <div className="p-4 space-y-3">
                {report.assigned_to && (
                  <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Assigned To</p><p className="text-sm font-semibold text-slate-800">{report.assigned_to}</p></div>
                )}
                {report.admin_notes && (
                  <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Notes</p><p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.admin_notes}</p></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 flex-wrap rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
          {canEdit && report.status === 'pending' && (
            <button onClick={() => onDeployResponder(report)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors">
              <Send className="w-4 h-4" />Dispatch Team
            </button>
          )}
          {canEdit && (
            <button onClick={() => onEditStatus(report)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded transition-colors ml-auto">
              <Edit3 className="w-4 h-4" />Update Status
            </button>
          )}
        </div>
      </div>

      {/* Image Zoom */}
      {isImageZoomed && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setIsImageZoomed(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all" onClick={() => setIsImageZoomed(false)}>
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImageUrl} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Edit Status Modal ────────────────────────────────────────────────────────
function EditReportModal({ report, onClose, onSave }) {
  const [formData, setFormData] = useState({
    status:      report.status,
    priority:    report.priority,
    assigned_to: report.assigned_to  || '',
    admin_notes: report.admin_notes  || '',
  });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(report.id, formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200">
        <div className="bg-slate-800 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Update Report Status</h2>
            <p className="text-slate-400 text-xs mt-0.5">{report.report_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Disposition Status',   key: 'status',   options: [['pending','Pending'],['in-progress','In Progress'],['resolved','Resolved'],['rejected','Rejected']] },
            { label: 'Priority Classification', key: 'priority', options: [['low','Low'],['medium','Medium'],['high','High'],['urgent','Urgent']] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">{label}</label>
              <select value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white">
                {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">Assigned Officer / Personnel</label>
            <input type="text" value={formData.assigned_to} onChange={e => setFormData(p => ({ ...p, assigned_to: e.target.value }))}
              placeholder="Enter name of assigned personnel"
              className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">Official Notes / Remarks</label>
            <textarea value={formData.admin_notes} onChange={e => setFormData(p => ({ ...p, admin_notes: e.target.value }))}
              placeholder="Enter official notes or remarks..." rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none" />
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50">
            {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [reports,         setReports]         = useState([]);
  const [responders,      setResponders]      = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport,  setSelectedReport]  = useState(null);
  const [editingReport,   setEditingReport]   = useState(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [priorityFilter,  setPriorityFilter]  = useState('all');
  const [loading,         setLoading]         = useState(true);
  const [userRole,        setUserRole]        = useState(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingReport,  setTrackingReport]  = useState(null);
  const [trackingResponder, setTrackingResponder] = useState(null);
  const [aiDataMap,       setAiDataMap]       = useState({});
  const [scanningId,      setScanningId]      = useState(null);
  const [acceptingAI,     setAcceptingAI]     = useState(false);

  useEffect(() => { fetchReports(); fetchResponders(); checkUserRole(); }, []);
  useEffect(() => { filterReports(); }, [reports, searchQuery, statusFilter, priorityFilter]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserRole(user?.user_metadata?.role || 'admin');
    } catch { setUserRole('admin'); }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchResponders = async () => {
    try {
      const { data } = await supabase.from('responders').select('*');
      setResponders(data || []);
    } catch (err) { console.error(err); }
  };

  const filterReports = () => {
    let f = reports;
    if (searchQuery) f = f.filter(r =>
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.report_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== 'all')   f = f.filter(r => r.status === statusFilter);
    if (priorityFilter !== 'all') f = f.filter(r => r.priority === priorityFilter);
    setFilteredReports(f);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    if (report.ai_verdict && !aiDataMap[report.id]) {
      setAiDataMap(prev => ({
        ...prev,
        [report.id]: {
          fraud: { verdict: report.ai_verdict, score: report.ai_score, explanation: report.ai_notes },
        },
      }));
    }
  };

  const handleRunAssessment = async (report) => {
    setScanningId(report.id);
    try {
      const [aiResult, fraudResult] = await Promise.all([
        analyzeReportWithAI({ category: report.category, title: report.title, description: report.description, location: report.location }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-report-evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify(report),
        }).then(r => r.json()).catch(() => null),
      ]);
      const merged = { ...aiResult, fraud: fraudResult || null };
      setAiDataMap(prev => ({ ...prev, [report.id]: merged }));
      setReports(prev => prev.map(r => r.id === report.id ? {
        ...r,
        ai_verdict: fraudResult?.verdict ?? r.ai_verdict,
        ai_score:   fraudResult?.score   ?? r.ai_score,
        ai_notes:   fraudResult?.explanation ?? r.ai_notes,
      } : r));
      if (selectedReport?.id === report.id) {
        setSelectedReport(prev => ({
          ...prev,
          ai_verdict: fraudResult?.verdict ?? prev.ai_verdict,
          ai_score:   fraudResult?.score   ?? prev.ai_score,
          ai_notes:   fraudResult?.explanation ?? prev.ai_notes,
        }));
      }
      await logAuditAction({ action: 'scan', actionType: 'report', description: `AI full assessment on ${report.report_number}`, severity: 'info', targetId: report.id });
    } catch (err) { console.error('Assessment error:', err); }
    finally { setScanningId(null); }
  };

  const handleAcceptAI = async (reportId) => {
    const ai = aiDataMap[reportId];
    if (!ai) return;
    setAcceptingAI(true);
    try {
      const report = reports.find(r => r.id === reportId);
      const notes = [
        `AI Assessment — ${new Date().toLocaleDateString()}`,
        `Priority: ${ai.priority?.toUpperCase()}`,
        `Severity: ${ai.severity}/10`,
        `Response: ${ai.responseTime}h`,
        ai.suggestedTeam ? `Suggested Team: ${getTeamConfig(ai.suggestedTeam).label}` : '',
        `Reasoning: ${ai.reasoning}`,
        ai.suggestedActions?.length ? `Actions: ${ai.suggestedActions.join(', ')}` : '',
        ai.fraud ? `Evidence: ${ai.fraud.verdict} (${Math.round((ai.fraud.score || 0) * 100)}% confidence)` : '',
      ].filter(Boolean).join('\n');
      const { error } = await supabase.from('reports').update({ priority: ai.priority, admin_notes: notes }).eq('id', reportId);
      if (error) throw error;
      await logAuditAction({ action: 'update', actionType: 'report', description: `Accepted AI assessment for ${report?.report_number}`, severity: 'info', targetId: reportId });
      setAiDataMap(prev => { const n = { ...prev }; delete n[reportId]; return n; });
      fetchReports();
    } catch (err) { console.error('Accept AI error:', err); }
    finally { setAcceptingAI(false); }
  };

  const handleDismissAI = (reportId) => {
    const id = reportId || selectedReport?.id;
    setAiDataMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete report ${report.report_number}? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('reports').delete().eq('id', report.id);
      if (error) throw error;
      await logAuditAction({ action: 'delete', actionType: 'report', description: `Deleted report ${report.report_number}`, severity: 'critical', targetId: report.id });
      fetchReports();
    } catch (err) { console.error(err); }
  };

  const handleSaveEdit = async (reportId, updates) => {
    try {
      const old = reports.find(r => r.id === reportId);
      const { error } = await supabase.from('reports').update(updates).eq('id', reportId);
      if (error) throw error;
      await logAuditAction({ action: 'update', actionType: 'report', description: `Updated report ${old?.report_number}`, severity: 'info', targetId: reportId });
      setEditingReport(null);
      fetchReports();
    } catch (err) { console.error(err); }
  };

  // ── Team-based deploy ─────────────────────────────────────────────────────
  const handleDeploy = async (teamValue, teamData) => {
    try {
      const availableMembers = teamData.available;
      const memberNames      = availableMembers.map(m => m.name).join(', ');

      // Mark all available team members as busy
      if (availableMembers.length > 0) {
        const ids = availableMembers.map(m => m.id);
        await supabase.from('responders').update({ status: 'busy' }).in('id', ids);
      }

      // Update report
      await supabase.from('reports').update({
        status:           'in-progress',
        assigned_to:      `${teamData.label} (${memberNames || 'Team'})`,
        responder_status: 'assigned',
      }).eq('id', selectedReport.id);

      await logAuditAction({
        action:      'deploy',
        actionType:  'responder',
        description: `Dispatched ${teamData.label} to ${selectedReport.report_number}. Members: ${memberNames || 'none available'}`,
        severity:    'info',
        targetId:    selectedReport.id,
        targetType:  'report',
        targetName:  selectedReport.title,
        newValues:   { assigned_to: teamData.label, team: teamValue, members_deployed: availableMembers.length },
      });

      setDeployModalOpen(false);
      setSelectedReport(null);
      fetchReports();
      fetchResponders();
    } catch (err) { console.error('Deploy error:', err); }
  };

  const handleTrackResponder = async (report) => {
    if (!report.assigned_to) return;
    // Find any member from the assigned team that's busy
    const teamValue = responders.find(r =>
      report.assigned_to?.toLowerCase().includes(getTeamConfig(r.team || 'bpso').label.toLowerCase())
    );
    const responder = responders.find(r => r.status === 'busy' &&
      report.assigned_to?.includes(r.name)
    ) || responders.find(r => r.status === 'busy');
    if (responder) {
      setTrackingReport(report);
      setTrackingResponder(responder);
      setTrackingModalOpen(true);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'system_administrator' || userRole === 'operator';

  const stats = {
    total:      reports.length,
    pending:    reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved:   reports.filter(r => r.status === 'resolved').length,
    urgent:     reports.filter(r => r.priority === 'urgent').length,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <FileText className="w-3.5 h-3.5" />Incident Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review, prioritize, and dispatch responses to citizen-filed reports</p>
        </div>
        <button onClick={fetchReports} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Filed',  value: stats.total,      icon: FileText,      color: 'text-slate-700'  },
          { label: 'Pending',      value: stats.pending,    icon: Clock,         color: 'text-amber-600'  },
          { label: 'In Progress',  value: stats.inProgress, icon: Radio,         color: 'text-blue-600'   },
          { label: 'Resolved',     value: stats.resolved,   icon: CheckCircle,   color: 'text-green-600'  },
          { label: 'Urgent',       value: stats.urgent,     icon: AlertTriangle, color: 'text-red-600'    },
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

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by title, report number, or reporter name..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }}
              className="px-3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 transition-colors flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Showing <strong className="text-slate-600">{filteredReports.length}</strong> of <strong className="text-slate-600">{reports.length}</strong> reports
        </p>
      </div>

      {/* Report Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-7 h-7 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-500 font-medium">Loading reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No reports found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onView={handleViewReport}
              onEdit={setEditingReport}
              onDelete={handleDelete}
              canEdit={canEdit}
              aiInsights={aiDataMap[report.id]}
              onTrackResponder={handleTrackResponder}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedReport && (
        <ViewReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onEditStatus={r => setEditingReport(r)}
          canEdit={canEdit}
          onDeployResponder={r => { setSelectedReport(r); setDeployModalOpen(true); }}
          onRunAssessment={handleRunAssessment}
          scanning={scanningId === selectedReport.id}
          aiData={aiDataMap[selectedReport.id] || null}
          onAcceptAI={handleAcceptAI}
          acceptingAI={acceptingAI}
          onDismissAI={() => handleDismissAI(selectedReport.id)}
        />
      )}

      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deployModalOpen && selectedReport && (
        <DeployTeamModal
          report={selectedReport}
          responders={responders}
          onClose={() => setDeployModalOpen(false)}
          onDeploy={handleDeploy}
          aiSuggestedTeam={aiDataMap[selectedReport.id]?.suggestedTeam}
        />
      )}

      {trackingModalOpen && trackingReport && trackingResponder && (
        <TrackResponderModal
          report={trackingReport}
          responder={trackingResponder}
          onClose={() => { setTrackingModalOpen(false); setTrackingReport(null); setTrackingResponder(null); }}
        />
      )}
    </div>
  );
}
