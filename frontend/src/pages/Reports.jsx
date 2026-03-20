// src/pages/Reports.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeJurisdiction, buildReportShareText } from '../utils/barangayJurisdiction';
import { supabase } from '../config/supabase';
import Groq from 'groq-sdk';
import {
  Search, Eye, Edit3, Trash2, X, FileText, MapPin, Clock, User, RefreshCw,
  Phone, Mail, MessageSquare, CheckCircle, AlertCircle, XCircle, Wrench,
  Heart, Shield, Leaf, AlertTriangle, Send, Bot, Loader, Zap, Bell,
  Navigation, Radio, Video, Images, ChevronDown, ChevronUp, Maximize2,
  Flag, Clock3, Users, BarChart2, Car, Crosshair, Route, Share2, ExternalLink,
} from 'lucide-react';
import { logAuditAction } from '../utils/auditLogger';
import UserActionModal from '../components/UserActionModal';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const RESPONSE_TEAMS = [
  { value: 'bpso',     label: 'BPSO Team',             description: 'Barangay Public Safety Officers',        header: 'bg-blue-700',   color: 'bg-blue-50 text-blue-700 border-blue-300'     },
  { value: 'disaster', label: 'Disaster Response Team', description: 'Emergency & disaster operations',         header: 'bg-orange-700', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'bhert',    label: 'BHERT',                  description: 'Barangay Health Emergency Response Team', header: 'bg-green-700',  color: 'bg-green-50 text-green-700 border-green-300'   },
  { value: 'general',  label: 'General Response',       description: 'Multi-purpose barangay responders',       header: 'bg-slate-600',  color: 'bg-slate-50 text-slate-700 border-slate-300'   },
];
const getTeamConfig = (team) => RESPONSE_TEAMS.find(t => t.value === team) || RESPONSE_TEAMS[3];

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
    pending:       { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', icon: AlertCircle, label: 'Pending'     },
    'in-progress': { bg: 'bg-blue-50',  text: 'text-blue-800',  border: 'border-blue-300',  icon: Loader,      label: 'In Progress' },
    resolved:      { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', icon: CheckCircle, label: 'Resolved'    },
    rejected:      { bg: 'bg-red-50',   text: 'text-red-800',   border: 'border-red-300',   icon: XCircle,     label: 'Rejected'    },
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

  const confidenceColor = {
    high:   'text-red-700 bg-red-100 border-red-300',
    medium: 'text-amber-700 bg-amber-100 border-amber-300',
    low:    'text-slate-600 bg-slate-100 border-slate-300',
  }[confidence] || 'text-amber-700 bg-amber-100 border-amber-300';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: detectedBarangay
            ? `Incident in ${detectedBarangay} — Needs Forwarding`
            : 'Incident Outside Salvacion — Needs Forwarding',
          text: shareText,
          url:  mapsUrl,
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
        <p className="text-xs font-bold text-white uppercase tracking-widest flex-1">
          Outside Salvacion Jurisdiction
        </p>
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
            {reasoning && (
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{reasoning}</p>
            )}
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
          {shareResult === 'shared' ? <><CheckCircle className="w-4 h-4" />Shared!</>         :
           shareResult === 'copied' ? <><CheckCircle className="w-4 h-4" />Copied to Clipboard</> :
           shareResult === 'error'  ? <><AlertCircle className="w-4 h-4" />Share Failed — Try Again</> :
           <><Share2 className="w-4 h-4" />Forward to Correct Barangay</>}
        </button>
        <p className="text-xs text-amber-600 text-center">
          Shares incident details, GPS coordinates, and a Google Maps link
        </p>
      </div>
    </div>
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

  const verdict       = verdictConfig[aiData?.fraud?.verdict] || verdictConfig.uncertain;
  const hasData       = !!(aiData?.priority || aiData?.fraud);
  const suggestedTeam = aiData?.suggestedTeam ? getTeamConfig(aiData.suggestedTeam) : null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-slate-300" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">AI-Assisted Assessment</span>
          {scanning && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-semibold animate-pulse">
              <Loader className="w-3 h-3 animate-spin" />Running...
            </span>
          )}
          {hasData && !scanning && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
              ✓ Results Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canRun && !scanning && (
            <button onClick={onRunAssessment} disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors border border-slate-500">
              <BarChart2 className="w-3.5 h-3.5" />Re-run Assessment
            </button>
          )}
          {hasData && (
            <button onClick={() => setExpanded(p => !p)} className="text-slate-400 hover:text-slate-200 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {scanning && (
        <div className="bg-slate-50 px-5 py-8 flex flex-col items-center justify-center border-t border-slate-200 gap-3">
          <div className="relative">
            <Loader className="w-8 h-8 text-slate-400 animate-spin" />
            <Bot className="w-4 h-4 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Running Full AI Assessment</p>
            <p className="text-xs text-slate-500 mt-0.5">Analyzing priority, fraud signals, and evidence integrity simultaneously...</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />Priority Analysis</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Evidence Verification</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />Team Recommendation</span>
          </div>
        </div>
      )}

      {!hasData && !scanning && (
        <div className="bg-slate-50 px-5 py-6 text-center border-t border-slate-200">
          <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Assessment could not be completed.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Re-run Assessment" to try again.</p>
        </div>
      )}

      {hasData && !scanning && expanded && (
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
                        <span className="shrink-0 w-5 h-5 bg-slate-200 text-slate-600 rounded text-xs font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
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
                    <span className={`w-2.5 h-2.5 rounded-full ${verdict.dot} shrink-0`} />
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
              <div className="flex gap-2 shrink-0">
                <button onClick={onDismiss} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors">Dismiss</button>
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
  const [routeCoords,       setRouteCoords]       = useState([]);
  const [routeInfo,         setRouteInfo]         = useState(null);
  const [fetchingRoute,     setFetchingRoute]     = useState(false);
  const [leaflet,           setLeaflet]           = useState(null);
  const [lastRouteFetch,    setLastRouteFetch]    = useState(null);
  const [mapInstance,       setMapInstance]       = useState(null);

  const responderId = responder?.id;
  const reportId    = report?.id;
  const reportLat   = report?.latitude;
  const reportLng   = report?.longitude;

  const routeRef        = useRef([]);
  const lastFetchRef    = useRef(null);
  const responderLocRef = useRef(null);

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
    if (!fromLat || !fromLng || !reportLat || !reportLng) return;
    setFetchingRoute(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-route', {
        body: { originLat: fromLat, originLng: fromLng, destLat: reportLat, destLng: reportLng },
      });
      if (error || !data?.coordinates?.length) return;
      setRouteCoords(data.coordinates);
      routeRef.current = data.coordinates;
      setRouteInfo({
        distance: data.distance ? `${(data.distance / 1000).toFixed(1)} km` : null,
        durationSec: data.duration || null,
      });
      lastFetchRef.current = { lat: fromLat, lng: fromLng };
      setLastRouteFetch({ lat: fromLat, lng: fromLng });
    } catch {}
    finally { setFetchingRoute(false); }
  }, [reportLat, reportLng]);

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
      const pulsingIcon = (color = '#0099FF') => new L.DivIcon({
        html: `
          <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${color}22;animation:pulse1 1.6s ease-out infinite;"></div>
            <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:${color}33;animation:pulse2 1.6s ease-out 0.5s infinite;"></div>
            <div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <style>
            @keyframes pulse1{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(1.5);opacity:0}}
            @keyframes pulse2{0%{transform:scale(0.6);opacity:0.6}100%{transform:scale(1.3);opacity:0}}
          </style>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const enRoutePulse  = pulsingIcon('#0099FF');
      const onScenePulse  = pulsingIcon('#00C48C');
      const assignedPulse = pulsingIcon('#FF8C00');

      const destIcon = new L.DivIcon({
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:32px;height:32px;background:#FF3B30;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(255,59,48,0.5);display:flex;align-items:center;justify-content:center;">
              <div style="transform:rotate(45deg);width:10px;height:10px;background:white;border-radius:50%;"></div>
            </div>
          </div>`,
        className: '',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      setLeaflet({ L, ...RLmod, enRoutePulse, onScenePulse, assignedPulse, destIcon });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!responderId || !reportId) return;

    const init = async () => {
      setLoading(true);
      try {
        const { data: rd } = await supabase.from('responders').select('current_lat,current_lng').eq('id', responderId).single();
        if (rd?.current_lat && rd?.current_lng) {
          setResponderLocation({ lat: rd.current_lat, lng: rd.current_lng });
          responderLocRef.current = { lat: rd.current_lat, lng: rd.current_lng };
          setDistance(calcDistance(rd.current_lat, rd.current_lng, reportLat, reportLng));
          await fetchRoute(rd.current_lat, rd.current_lng);
        }
        const { data: rpt } = await supabase.from('reports').select('responder_status').eq('id', reportId).single();
        if (rpt) setResponderStatus(rpt.responder_status);
      } finally { setLoading(false); }
    };
    init();

    const ch1 = supabase.channel(`rpt-track-resp-${responderId}-${Date.now()}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'responders', filter:`id=eq.${responderId}` },
        async ({ new: n }) => {
          if (!n.current_lat || !n.current_lng) return;
          const newLoc = { lat: n.current_lat, lng: n.current_lng };
          setResponderLocation(newLoc);
          responderLocRef.current = newLoc;
          setDistance(calcDistance(n.current_lat, n.current_lng, reportLat, reportLng));
          const last = lastFetchRef.current;
          if (!last || getDistanceMeters(last.lat, last.lng, n.current_lat, n.current_lng) > 40) {
            await fetchRoute(n.current_lat, n.current_lng);
          }
        }
      ).subscribe();

    const ch2 = supabase.channel(`rpt-track-status-${reportId}-${Date.now()}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'reports', filter:`id=eq.${reportId}` },
        ({ new: n }) => setResponderStatus(n.responder_status)
      ).subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase.from('responders').select('current_lat,current_lng').eq('id', responderId).single();
      if (data?.current_lat && data?.current_lng) {
        const newLoc = { lat: data.current_lat, lng: data.current_lng };
        setResponderLocation(newLoc);
        responderLocRef.current = newLoc;
        setDistance(calcDistance(data.current_lat, data.current_lng, reportLat, reportLng));
        const last = lastFetchRef.current;
        if (!last || getDistanceMeters(last.lat, last.lng, data.current_lat, data.current_lng) > 40) {
          await fetchRoute(data.current_lat, data.current_lng);
        }
      }
    }, 10000);

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      clearInterval(poll);
    };
  }, [responderId, reportId, reportLat, reportLng, calcDistance, fetchRoute]);

  const fmtETA = (sec) => {
    if (!sec || sec <= 0) return 'Arriving';
    const m = Math.floor(sec / 60);
    if (m <= 0) return '< 1 min';
    return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m} min`;
  };

  const statusSteps = [
    { key:'assigned',   label:'Assigned',   icon:<Send className="w-3.5 h-3.5" />        },
    { key:'en_route',   label:'En Route',   icon:<Car className="w-3.5 h-3.5" />         },
    { key:'on_scene',   label:'On Scene',   icon:<MapPin className="w-3.5 h-3.5" />      },
    { key:'completing', label:'Completing', icon:<CheckCircle className="w-3.5 h-3.5" /> },
  ];
  const stepOrder  = ['assigned','en_route','on_scene','completing'];
  const activeStep = stepOrder.indexOf(responderStatus);
  const teamCfg    = getTeamConfig(responder?.team || 'bpso');
  const isArrived  = ['on_scene','completing'].includes(responderStatus);

  const renderMap = () => {
    if (!leaflet) return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <Loader className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );

    const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, enRoutePulse, onScenePulse, assignedPulse, destIcon, L } = leaflet;

    const responderIcon = responderStatus === 'on_scene' ? onScenePulse
                        : responderStatus === 'en_route' ? enRoutePulse
                        : assignedPulse;

    function MapFitter({ respLoc, destLat, destLng, route }) {
      const map = useMap();
      useEffect(() => {
        if (!map) return;
        if (route?.length > 1) {
          map.fitBounds(L.latLngBounds(route.map(c => [c.latitude, c.longitude])), { padding:[40,40] });
        } else if (respLoc && destLat && destLng) {
          map.fitBounds(L.latLngBounds([[respLoc.lat,respLoc.lng],[destLat,destLng]]), { padding:[60,60] });
        }
      }, []);
      return null;
    }

    const center = responderLocation
      ? [responderLocation.lat, responderLocation.lng]
      : reportLat && reportLng ? [reportLat, reportLng] : [14.5995, 120.9842];

    return (
      <MapContainer center={center} zoom={15} style={{ height:'100%', width:'100%' }}
        ref={(m) => m && setMapInstance(m)}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {routeCoords.length > 1 && (
          <>
            <Polyline positions={routeCoords.map(c => [c.latitude, c.longitude])} pathOptions={{ color:'#000000', weight:9, opacity:0.3, lineCap:'round', lineJoin:'round' }} />
            <Polyline positions={routeCoords.map(c => [c.latitude, c.longitude])} pathOptions={{ color: isArrived ? '#00C48C' : '#0099FF', weight:5, opacity:1, lineCap:'round', lineJoin:'round' }} />
          </>
        )}
        {responderLocation && (
          <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
            <Popup>
              <div className="text-xs font-bold">{responder?.name}</div>
              <div className="text-xs text-slate-500">{teamCfg.label}</div>
              {distance && <div className="text-xs text-blue-600 mt-1">{distance} km from scene</div>}
            </Popup>
          </Marker>
        )}
        {reportLat && reportLng && (
          <Marker position={[reportLat, reportLng]} icon={destIcon}>
            <Popup><div className="text-xs font-bold">{report.title}</div></Popup>
          </Marker>
        )}
        <MapFitter respLoc={responderLocation} destLat={reportLat} destLng={reportLng} route={routeCoords} />
      </MapContainer>
    );
  };

  if (!responder) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-slate-700 flex flex-col">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                {responder.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                responderStatus === 'on_scene' ? 'bg-green-500' :
                responderStatus === 'en_route' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'
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
                  <div className="flex items-center gap-1 text-xs text-blue-400">
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
          <div className="flex-1 min-h-64 md:min-h-0 relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center bg-slate-900 gap-3">
                <Loader className="w-8 h-8 text-slate-400 animate-spin" />
                <p className="text-sm text-slate-400">Connecting to GPS feed...</p>
              </div>
            ) : renderMap()}

            {!loading && responderStatus === 'en_route' && routeInfo && (
              <div className="absolute top-3 left-3 bg-slate-900/90 rounded-xl px-4 py-3 border border-slate-700 backdrop-blur-sm">
                <div className="text-2xl font-black text-blue-400 leading-none">{fmtETA(routeInfo.durationSec)}</div>
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
                  <p className="text-xs text-slate-500 mt-1">Updates every 10 seconds.</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-72 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col overflow-y-auto">
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
                          active ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' :
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
                            {step.key === 'en_route'  ? `${distance ? distance + ' km away' : 'In transit'}` :
                             step.key === 'on_scene'  ? 'Attending to incident' :
                             step.key === 'assigned'  ? 'Preparing for dispatch' : 'Wrapping up'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Distance', value: distance ? `${distance} km` : '—', icon: <Route className="w-3.5 h-3.5" />, color: 'text-blue-400' },
                  { label: 'ETA', value: isArrived ? 'On Scene' : fmtETA(routeInfo?.durationSec), icon: <Clock className="w-3.5 h-3.5" />, color: isArrived ? 'text-green-400' : 'text-blue-400' },
                  { label: 'Route', value: routeInfo?.distance || (routeCoords.length > 1 ? 'Loaded' : 'Pending'), icon: <Navigation className="w-3.5 h-3.5" />, color: routeCoords.length > 1 ? 'text-green-400' : 'text-slate-400' },
                  { label: 'GPS Feed', value: responderLocation ? 'Live' : 'Searching', icon: <Crosshair className="w-3.5 h-3.5" />, color: responderLocation ? 'text-green-400' : 'text-amber-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-xs font-bold uppercase tracking-wide">{label}</span></div>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {responderLocation && (
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Responder GPS</p>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 font-mono text-xs text-slate-300">
                  <div>{responderLocation.lat.toFixed(6)},</div>
                  <div>{responderLocation.lng.toFixed(6)}</div>
                </div>
              </div>
            )}

            {responderLocation && reportLat && reportLng && (
              <div className="px-5 py-4">
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${responderLocation.lat},${responderLocation.lng}&destination=${reportLat},${reportLng}&travelmode=driving`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
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

// ─── Deploy Team Modal ────────────────────────────────────────────────────────
function DeployTeamModal({ report, responders, onClose, onDeploy, aiSuggestedTeam }) {
  const [selectedTeam,   setSelectedTeam]   = useState(aiSuggestedTeam || null);
  const [step,           setStep]           = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [deploying,      setDeploying]      = useState(false);

  if (!report) return null;

  const teamSummary = RESPONSE_TEAMS.map(team => {
    const members   = responders.filter(r => (r.team || 'bpso') === team.value);
    const available = members.filter(r => r.status === 'available');
    const busy      = members.filter(r => r.status === 'busy');
    return { ...team, members, available, busy };
  });

  const selectedTeamData = teamSummary.find(t => t.value === selectedTeam);
  const selectedLead     = selectedTeamData?.available.find(m => m.id === selectedLeadId);

  const handleConfirmDeploy = async () => {
    setDeploying(true);
    await onDeploy(selectedTeam, selectedTeamData, selectedLeadId);
    setDeploying(false);
  };

  if (step === 1) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4" />Dispatch Response Team</h2>
          <p className="text-slate-400 text-xs mt-1">{report.report_number} — {report.title}</p>
          {aiSuggestedTeam && (
            <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />AI recommends: <strong className="text-white ml-1">{getTeamConfig(aiSuggestedTeam).label}</strong>
            </p>
          )}
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Step 1 of 3 — Select team:</p>
          {teamSummary.map(team => {
            const isSelected   = selectedTeam === team.value;
            const isAiPick     = aiSuggestedTeam === team.value;
            const hasAvailable = team.available.length > 0;
            return (
              <button key={team.value} onClick={() => hasAvailable && setSelectedTeam(team.value)} disabled={!hasAvailable}
                className={`w-full flex items-center justify-between p-4 rounded border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${team.header} rounded flex items-center justify-center shrink-0`}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{team.label}</p>
                      {isAiPick && <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2 py-0.5 rounded font-semibold"><Bot className="w-3 h-3" />AI Pick</span>}
                    </div>
                    <p className="text-xs text-slate-500">{team.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">{team.available.length} available</span>
                  {team.busy.length > 0 && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">{team.busy.length} busy</span>}
                  {!hasAvailable && <span className="text-xs text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">Unavailable</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => { setSelectedLeadId(selectedTeamData?.available[0]?.id || null); setStep(2); }} disabled={!selectedTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40">
            Next: Pick Lead Responder →
          </button>
        </div>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Radio className="w-4 h-4 text-slate-300" />Pick Lead Responder</h2>
            <p className="text-slate-400 text-xs mt-1">{selectedTeamData?.label} — Step 2 of 3</p>
          </div>
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white p-1.5 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 font-medium">Select <strong>one member</strong> whose GPS will be tracked. All available members will be dispatched.</p>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Available — {selectedTeamData?.available.length} members:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {selectedTeamData?.available.map((member) => {
              const isSelected = selectedLeadId === member.id;
              const hasGPS     = member.current_lat && member.current_lng;
              return (
                <button key={member.id} onClick={() => setSelectedLeadId(member.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded border-2 transition-all text-left ${isSelected ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {member.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{member.name}</p>
                      <span className={`text-xs font-medium flex items-center gap-1 ${hasGPS ? 'text-green-600' : 'text-amber-600'}`}>
                        <MapPin className="w-3 h-3" />{hasGPS ? 'GPS Active' : 'No GPS yet'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-white px-2.5 py-1 rounded-full font-bold"><Radio className="w-3 h-3" />Lead</span>}
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
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />Please select a lead responder to continue.
            </p>
          )}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex gap-2">
          <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">← Back</button>
          <button onClick={() => setStep(3)} disabled={!selectedLeadId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-40">
            Next: Confirm Dispatch →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Confirm Dispatch</h2>
            <p className="text-slate-400 text-xs mt-1">Step 3 of 3 — Review before sending</p>
          </div>
          <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white p-1.5 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Report</p>
            <p className="text-sm font-bold text-slate-900">{report.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{report.report_number} · {report.location || 'No location'}</p>
            <div className="flex items-center gap-2 mt-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
          </div>
          <div className="border-2 border-slate-700 rounded-lg p-4 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Dispatch Summary</p>
            {selectedTeamData && (
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${selectedTeamData.header} rounded flex items-center justify-center shrink-0`}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedTeamData.label}</p>
                  <p className="text-xs text-slate-500">{selectedTeamData.available.length} members will be dispatched</p>
                </div>
              </div>
            )}
            <div className="mb-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">All dispatched members:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTeamData?.available.map(m => (
                  <span key={m.id} className={`text-xs px-2 py-0.5 rounded font-medium border ${m.id === selectedLeadId ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300'}`}>
                    {m.id === selectedLeadId ? '📡 ' : ''}{m.name}{m.id === selectedLeadId ? ' (Lead)' : ''}
                  </span>
                ))}
              </div>
            </div>
            {selectedLead && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Live Tracking: {selectedLead.name}</p>
                  <p className="text-xs text-blue-600 mt-0.5">This person's GPS will be shown on the map</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">This marks the report as <strong>In Progress</strong> and sets all dispatched members to <strong>Busy</strong>.</p>
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2">
          <button onClick={() => setStep(2)} disabled={deploying} className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50">← Go Back</button>
          <button onClick={handleConfirmDeploy} disabled={deploying}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors disabled:opacity-50">
            {deploying ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Dispatching...</> : <><Send className="w-3.5 h-3.5" />Yes, Dispatch Team</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onView, onEdit, onDelete, canEdit, aiInsights, onTrackResponder, onUserAction }) {
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
  const catCfg       = categoryIcons[report.category] || categoryIcons.other;
  const CatIcon      = catCfg.icon;
  const isUrgent     = report.priority === 'urgent';
  const isInProgress = report.status === 'in-progress';
  const hasFraudAI   = !!report.ai_verdict;
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
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider"><Zap className="w-3.5 h-3.5" />Urgent Priority</div>
          <Bell className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      {isInProgress && (
        <div className="bg-slate-700 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider"><Radio className="w-3.5 h-3.5" />Responder Deployed</div>
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
          <div className="bg-slate-100 p-1.5 rounded shrink-0 ml-2"><CatIcon className="w-4 h-4 text-slate-600" /></div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded capitalize border border-slate-200">{catCfg.label}</span>
          <PriorityBadge priority={report.priority} />
          <StatusBadge status={report.status} />
          {report.responder_status && <ResponderStatusBadge status={report.responder_status} reportStatus={report.status} />}
          {report._outsideSalvacion && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold bg-amber-50 text-amber-700 border-amber-300">
              <AlertTriangle className="w-3 h-3" />Outside Salvacion
            </span>
          )}
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
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span className="line-clamp-1">{report.location || 'No location provided'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
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
              <button onClick={() => onEdit(report)} className="p-2 text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
              <button
                onClick={e => { e.stopPropagation(); onUserAction({ id: report.reporter_id, email: report.reporter_email, full_name: report.reporter_name, phone: report.reporter_phone, account_status: 'active' }); }}
                className="p-2 text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition-colors" title="Flag / Suspend Reporter">
                <Flag className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(report)} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View Report Modal ────────────────────────────────────────────────────────
function ViewReportModal({ report, onClose, onEditStatus, canEdit, onDeployResponder, onRunAssessment, scanning, aiData, onAcceptAI, acceptingAI, onDismissAI, onUserAction, jurisdictionResult, scanningJurisdiction }) {
  const [isImageZoomed,  setIsImageZoomed]  = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);

  if (!report) return null;
  const imageUrls = Array.isArray(report.media_urls) ? report.media_urls : [];
  const hasImages = imageUrls.length > 0;
  const hasVideo  = !!report.video_url;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
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
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded transition-colors shrink-0"><X className="w-5 h-5" /></button>
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

          <JurisdictionBanner jurisdictionResult={jurisdictionResult} scanning={scanningJurisdiction} incident={report} buildShareText={buildReportShareText} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5" />Reporter Information</p>
                {canEdit && (
                  <button onClick={() => onUserAction({ id: report.reporter_id, email: report.reporter_email, full_name: report.reporter_name, phone: report.reporter_phone, account_status: 'active' })}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors">
                    <Flag className="w-3 h-3" /> Flag User
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Full Name</p><p className="text-sm font-semibold text-slate-800">{report.reporter_name}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Contact Number</p>
                  <a href={`tel:${report.reporter_phone}`} className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{report.reporter_phone || 'N/A'}</a></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Email Address</p>
                  <a href={`mailto:${report.reporter_email}`} className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{report.reporter_email}</a></div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3.5 h-3.5" />Incident Details</p>
              </div>
              <div className="p-4 space-y-3">
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Classification</p><p className="text-sm font-semibold text-slate-800 capitalize">{report.category}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date Filed</p><p className="text-sm text-slate-700">{new Date(report.created_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</p></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Description</p><p className="text-sm text-slate-700 leading-relaxed">{report.description}</p></div>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />Location Information</p>
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

          {(report.assigned_to || report.admin_notes) && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" />Administrative Notes</p>
              </div>
              <div className="p-4 space-y-3">
                {report.assigned_to && <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Assigned To</p><p className="text-sm font-semibold text-slate-800">{report.assigned_to}</p></div>}
                {report.admin_notes && <div><p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Notes</p><p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.admin_notes}</p></div>}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 flex-wrap rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Close</button>
          {canEdit && (
            <button onClick={() => onUserAction({ id: report.reporter_id, email: report.reporter_email, full_name: report.reporter_name, phone: report.reporter_phone, account_status: 'active' })}
              className="flex items-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-semibold rounded transition-colors">
              <Flag className="w-4 h-4" /> Flag / Suspend Reporter
            </button>
          )}
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
    assigned_to: report.assigned_to || '',
    admin_notes: report.admin_notes || '',
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
            { label: 'Disposition Status',      key: 'status',   options: [['pending','Pending'],['in-progress','In Progress'],['resolved','Resolved'],['rejected','Rejected']] },
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

// ─── Main Reports Component ───────────────────────────────────────────────────
export default function Reports() {
  const [reports,           setReports]           = useState([]);
  const [responders,        setResponders]        = useState([]);
  const [filteredReports,   setFilteredReports]   = useState([]);
  const [selectedReport,    setSelectedReport]    = useState(null);
  const [editingReport,     setEditingReport]     = useState(null);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [statusFilter,      setStatusFilter]      = useState('all');
  const [priorityFilter,    setPriorityFilter]    = useState('all');
  const [loading,           setLoading]           = useState(true);
  const [userRole,          setUserRole]          = useState(null);
  const [deployModalOpen,   setDeployModalOpen]   = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingReport,    setTrackingReport]    = useState(null);
  const [trackingResponder, setTrackingResponder] = useState(null);
  const [aiDataMap,         setAiDataMap]         = useState({});
  const [scanningId,        setScanningId]        = useState(null);
  const [acceptingAI,       setAcceptingAI]       = useState(false);
  const [userActionModal,   setUserActionModal]   = useState(null);
  const [jurisdictionMap,   setJurisdictionMap]   = useState({});
  const [scanningJurisdictionId, setScanningJurisdictionId] = useState(null);

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
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
    if (statusFilter !== 'all')   f = f.filter(r => r.status   === statusFilter);
    if (priorityFilter !== 'all') f = f.filter(r => r.priority === priorityFilter);
    setFilteredReports(f);
  };

  // ── KEY CHANGE: Auto-run full AI assessment when operator opens a report ──
  const handleViewReport = (report) => {
    setSelectedReport(report);

    // Restore any existing fraud data saved in DB from a previous session
    if (report.ai_verdict && !aiDataMap[report.id]) {
      setAiDataMap(prev => ({
        ...prev,
        [report.id]: {
          fraud: {
            verdict:     report.ai_verdict,
            score:       report.ai_score,
            explanation: report.ai_notes,
          },
        },
      }));
    }

    // Auto-run jurisdiction check if we have coords and haven't checked yet
    if (report.latitude && report.longitude && !jurisdictionMap[report.id]) {
      handleJurisdictionCheck(report);
    }

    // Auto-run full AI assessment (priority + fraud) if not already done this session
    if (!aiDataMap[report.id]) {
      handleRunAssessment(report);
    }
  };

  const handleJurisdictionCheck = async (report) => {
    if (!report.latitude || !report.longitude) return;
    setScanningJurisdictionId(report.id);
    try {
      const result = await analyzeJurisdiction({
        lat:          report.latitude,
        lng:          report.longitude,
        locationText: report.location || '',
      });
      if (result) {
        setJurisdictionMap(prev => ({ ...prev, [report.id]: result }));
        if (result.isOutside) {
          setReports(prev => prev.map(r => r.id === report.id ? { ...r, _outsideSalvacion: true } : r));
        }
      }
    } catch (err) {
      console.error('Jurisdiction check error:', err);
    } finally {
      setScanningJurisdictionId(null);
    }
  };

  const handleOpenUserAction = (user) => { if (!user) return; setUserActionModal(user); };

  const handleRunAssessment = async (report) => {
    setScanningId(report.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [aiResult, fraudResult] = await Promise.all([
        analyzeReportWithAI({
          category:    report.category,
          title:       report.title,
          description: report.description,
          location:    report.location,
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-report-evidence`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ report }),
        })
          .then(async res => { const text = await res.text(); try { return JSON.parse(text); } catch { return null; } })
          .catch(() => null),
      ]);

      const merged = { ...aiResult, fraud: fraudResult || null };
      setAiDataMap(prev => ({ ...prev, [report.id]: merged }));
      setReports(prev => prev.map(r =>
        r.id === report.id
          ? { ...r, ai_verdict: fraudResult?.verdict ?? r.ai_verdict, ai_score: fraudResult?.score ?? r.ai_score, ai_notes: fraudResult?.explanation ?? r.ai_notes }
          : r
      ));
      if (selectedReport?.id === report.id) {
        setSelectedReport(prev => ({
          ...prev,
          ai_verdict: fraudResult?.verdict ?? prev.ai_verdict,
          ai_score:   fraudResult?.score   ?? prev.ai_score,
          ai_notes:   fraudResult?.explanation ?? prev.ai_notes,
        }));
      }
      await logAuditAction({
        action:      'scan',
        actionType:  'report',
        description: `AI full assessment on ${report.report_number}`,
        severity:    'info',
        targetId:    report.id,
      });
    } catch (err) {
      console.error('Assessment error:', err);
    } finally {
      setScanningId(null);
    }
  };

  const handleAcceptAI = async (reportId) => {
    const ai = aiDataMap[reportId];
    if (!ai) return;
    setAcceptingAI(true);
    try {
      const report = reports.find(r => r.id === reportId);
      const notes = [
        `AI Assessment (${new Date().toLocaleDateString()})`,
        `Priority: ${ai.priority?.toUpperCase()}`,
        `Severity: ${ai.severity}/10`,
        `Response: ${ai.responseTime}h`,
        ai.suggestedTeam ? `Suggested Team: ${getTeamConfig(ai.suggestedTeam).label}` : null,
        `Reasoning: ${ai.reasoning}`,
        ai.suggestedActions?.length ? `Actions: ${ai.suggestedActions.join(', ')}` : null,
        ai.fraud ? `Evidence: ${ai.fraud.verdict} (${Math.round((ai.fraud.score || 0) * 100)}% confidence)` : null,
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('reports').update({ priority: ai.priority, admin_notes: notes }).eq('id', reportId);
      if (error) throw error;
      await logAuditAction({ action: 'update', actionType: 'report', description: `Accepted AI assessment for ${report?.report_number}`, severity: 'info', targetId: reportId });
      setAiDataMap(prev => { const n = { ...prev }; delete n[reportId]; return n; });
      fetchReports();
    } catch (err) {
      console.error('Accept AI error:', err);
    } finally {
      setAcceptingAI(false);
    }
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

  const handleDeploy = async (teamValue, teamData, leadResponderId) => {
    try {
      const availableMembers = teamData.available;
      const memberNames      = availableMembers.map(m => m.name).join(', ');
      const leadResponder    = availableMembers.find(m => m.id === leadResponderId);
      if (availableMembers.length > 0) await supabase.from('responders').update({ status: 'busy' }).in('id', availableMembers.map(m => m.id));
      await supabase.from('reports').update({
        status:               'in-progress',
        assigned_to:          `${teamData.label}: ${memberNames}`,
        assigned_responder_id: leadResponderId,
        responder_status:     'assigned',
      }).eq('id', selectedReport.id);
      try {
        await logAuditAction({
          action:      'deploy',
          actionType:  'responder',
          description: `Dispatched ${teamData.label} to ${selectedReport.report_number}. Lead: ${leadResponder?.name ?? 'N/A'}. Members: ${memberNames}`,
          severity:    'warning',
          targetId:    selectedReport.id,
          targetType:  'report',
          targetName:  selectedReport.title,
          newValues:   { assigned_to: teamData.label, team: teamValue, lead: leadResponder?.name, membersDeployed: availableMembers.length },
        });
      } catch (auditErr) { console.error('Audit log failed for deploy:', auditErr); }
      setDeployModalOpen(false);
      setSelectedReport(null);
      fetchReports();
      fetchResponders();
    } catch (err) { console.error('Deploy error:', err); }
  };

  const handleTrackResponder = async (report) => {
    if (!report) return;
    const leadId = report.assigned_responder_id;
    if (leadId) {
      const { data: responder } = await supabase.from('responders').select('*').eq('id', leadId).single();
      if (responder) {
        setTrackingReport(report);
        setTrackingResponder(responder);
        setTrackingModalOpen(true);
        return;
      }
    }
    const fallback = responders.find(r => r.status === 'busy' && report.assigned_to?.includes(r.name)) || responders.find(r => r.status === 'busy');
    if (!fallback) { alert('No active responder found for this report.'); return; }
    setTrackingReport(report);
    setTrackingResponder(fallback);
    setTrackingModalOpen(true);
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Filed',  value: stats.total,      icon: FileText,      color: 'text-slate-700' },
          { label: 'Pending',      value: stats.pending,    icon: Clock,         color: 'text-amber-600' },
          { label: 'In Progress',  value: stats.inProgress, icon: Radio,         color: 'text-blue-600'  },
          { label: 'Resolved',     value: stats.resolved,   icon: CheckCircle,   color: 'text-green-600' },
          { label: 'Urgent',       value: stats.urgent,     icon: AlertTriangle, color: 'text-red-600'   },
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
            <ReportCard key={report.id} report={report} onView={handleViewReport} onEdit={setEditingReport}
              onDelete={handleDelete} canEdit={canEdit} aiInsights={aiDataMap[report.id]}
              onTrackResponder={handleTrackResponder} onUserAction={handleOpenUserAction} />
          ))}
        </div>
      )}

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
          onDismissAI={() => handleDismissAI(selectedReport?.id)}
          onUserAction={handleOpenUserAction}
          jurisdictionResult={jurisdictionMap[selectedReport.id] || null}
          scanningJurisdiction={scanningJurisdictionId === selectedReport.id}
        />
      )}
      {editingReport && (
        <EditReportModal report={editingReport} onClose={() => setEditingReport(null)} onSave={handleSaveEdit} />
      )}
      {deployModalOpen && selectedReport && (
        <DeployTeamModal report={selectedReport} responders={responders} onClose={() => setDeployModalOpen(false)}
          onDeploy={handleDeploy} aiSuggestedTeam={aiDataMap[selectedReport.id]?.suggestedTeam || null} />
      )}
      {trackingModalOpen && trackingReport && trackingResponder && (
        <TrackResponderModal report={trackingReport} responder={trackingResponder}
          onClose={() => { setTrackingModalOpen(false); setTrackingReport(null); setTrackingResponder(null); }} />
      )}
      {userActionModal && (
        <UserActionModal user={userActionModal} onClose={() => setUserActionModal(null)} onSuccess={fetchReports} />
      )}
    </div>
  );
}