// src/pages/Analytics.jsx — Data-driven analytics, no AI
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Users, FileText,
  Ambulance, BarChart3, PieChart, TrendingUp, TrendingDown,
  Download, RefreshCw, ArrowUpRight, ArrowDownRight, Target,
  Shield, Star, Filter, ChevronUp, ChevronDown, Calendar,
  Zap, MessageSquare, UserCheck, Package, MapPin, Layers
} from 'lucide-react';

// ─── SVG CHART PRIMITIVES ───────────────────────────────────────────────────

function LineChart({ series = [], height = 160, showGrid = true }) {
  if (!series.length || !series[0]?.data?.length) return (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
  );
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals, 1);
  const min = 0;
  const range = max - min || 1;
  const W = 100, H = 100;
  const pad = { t: 8, r: 4, b: 16, l: 28 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const toX = (i, n) => pad.l + (i / (n - 1 || 1)) * cw;
  const toY = (v) => pad.t + (1 - (v - min) / range) * ch;

  const ticks = 4;
  const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = min + (range / ticks) * i;
    const y = toY(v);
    return { v: Math.round(v), y };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {showGrid && gridLines.map(({ v, y }, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y}
            stroke="#e2e8f0" strokeWidth="0.4" strokeDasharray="1,2" />
          <text x={pad.l - 2} y={y + 1} textAnchor="end"
            fontSize="4" fill="#94a3b8">{v}</text>
        </g>
      ))}
      {series.map((s, si) => {
        const n = s.data.length;
        const pts = s.data.map((v, i) => `${toX(i, n)},${toY(v)}`).join(' ');
        const area = [
          `M ${toX(0, n)},${toY(0)}`,
          ...s.data.map((v, i) => `L ${toX(i, n)},${toY(v)}`),
          `L ${toX(n - 1, n)},${toY(0)}`, 'Z'
        ].join(' ');
        return (
          <g key={si}>
            <path d={area} fill={s.color} opacity="0.08" />
            <polyline points={pts} fill="none" stroke={s.color}
              strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            {n <= 14 && s.data.map((v, i) => (
              <circle key={i} cx={toX(i, n)} cy={toY(v)} r="1.2"
                fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function BarChart({ data = [], color = '#3b82f6', horizontal = false, height = 160 }) {
  if (!data.length) return (
    <div className="flex items-center justify-center" style={{ height }}>
      <span className="text-slate-400 text-sm">No data</span>
    </div>
  );
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 100, H = 100;
  const pad = horizontal
    ? { t: 4, r: 8, b: 4, l: 32 }
    : { t: 8, r: 4, b: 20, l: 24 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  if (horizontal) {
    const barH = ch / data.length;
    const gap = barH * 0.25;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const bw = (d.value / maxVal) * cw;
          const y = pad.t + i * barH + gap / 2;
          const bh = barH - gap;
          return (
            <g key={i}>
              <text x={pad.l - 2} y={y + bh / 2 + 1.5} textAnchor="end"
                fontSize="3.8" fill="#64748b" className="truncate"
                style={{ fontFamily: 'inherit' }}>
                {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
              </text>
              <rect x={pad.l} y={y} width={Math.max(bw, 0.5)} height={bh}
                fill={d.color || color} rx="1" opacity="0.85" />
              <text x={pad.l + bw + 1} y={y + bh / 2 + 1.5}
                fontSize="3.5" fill="#475569">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const barW = cw / data.length;
  const gap = barW * 0.3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ch}
        stroke="#e2e8f0" strokeWidth="0.4" />
      <line x1={pad.l} y1={pad.t + ch} x2={W - pad.r} y2={pad.t + ch}
        stroke="#e2e8f0" strokeWidth="0.4" />
      {[0, 0.5, 1].map((frac, i) => {
        const y = pad.t + ch - frac * ch;
        const v = Math.round(maxVal * frac);
        return (
          <g key={i}>
            {frac > 0 && <line x1={pad.l} y1={y} x2={W - pad.r} y2={y}
              stroke="#e2e8f0" strokeWidth="0.3" strokeDasharray="1,2" />}
            <text x={pad.l - 2} y={y + 1.5} textAnchor="end"
              fontSize="3.5" fill="#94a3b8">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (d.value / maxVal) * ch;
        const x = pad.l + i * barW + gap / 2;
        const bw = barW - gap;
        const y = pad.t + ch - bh;
        const label = d.label.length > 5 ? d.label.slice(0, 4) + '…' : d.label;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(bh, 0.5)}
              fill={d.color || color} rx="1" opacity="0.85" />
            <text x={x + bw / 2} y={pad.t + ch + 5} textAnchor="middle"
              fontSize="3.2" fill="#64748b">{label}</text>
            {d.value > 0 && bh > 8 && (
              <text x={x + bw / 2} y={y + 5} textAnchor="middle"
                fontSize="3.5" fill="white" fontWeight="600">{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data = [], size = 120 }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 38, cx = 50, cy = 50, sw = 14;

  // Single segment — render a plain circle instead of a degenerate arc
  if (data.length === 1) {
    return (
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={data[0].color} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="white" />
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="10" fontWeight="700"
          fill="#1e293b">{total}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="4.5"
          fill="#64748b">total</text>
      </svg>
    );
  }

  let cumAngle = -90;
  const arcs = data.map(d => {
    const angle = (d.value / total) * 360;
    const startA = cumAngle;
    cumAngle += angle;
    const endA = cumAngle;
    const toRad = a => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startA));
    const y1 = cy + r * Math.sin(toRad(startA));
    const x2 = cx + r * Math.cos(toRad(endA));
    const y2 = cy + r * Math.sin(toRad(endA));
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, angle };
  });

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill="none"
          stroke={a.color} strokeWidth={sw} strokeLinecap="butt" />
      ))}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="white" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="10" fontWeight="700"
        fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="4.5"
        fill="#64748b">total</text>
    </svg>
  );
}

function HeatmapGrid({ hourData = [] }) {
  const max = Math.max(...hourData, 1);
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
      {Array.from({ length: 24 }, (_, h) => {
        const count = hourData[h] || 0;
        const intensity = count / max;
        const bg = intensity === 0 ? '#f1f5f9'
          : intensity < 0.25 ? '#bfdbfe'
          : intensity < 0.5 ? '#60a5fa'
          : intensity < 0.75 ? '#2563eb'
          : '#1e3a8a';
        const text = intensity > 0.5 ? 'white' : '#374151';
        return (
          <div key={h} title={`${h}:00 — ${count} incidents`}
            className="aspect-square rounded flex items-center justify-center cursor-default"
            style={{ backgroundColor: bg }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: text,
              fontFamily: 'monospace' }}>{h}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SMALL COMPONENTS ───────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, trend, color = 'blue', loading = false }) {
  const palette = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    slate:  { bg: 'bg-slate-50',  icon: 'text-slate-600',  border: 'border-slate-100' },
  };
  const p = palette[color] || palette.blue;
  return (
    <div className={`bg-white rounded-2xl border ${p.border} p-5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${p.bg}`}>
          <Icon className={`w-4 h-4 ${p.icon}`} />
        </div>
        {trend !== undefined && !loading && (
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full
            ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-28" />
        </div>
      ) : (
        <>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
          </div>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor = 'text-slate-500', children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatRow({ label, value, pct, color = '#3b82f6', sub }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 capitalize">{label}</span>
        <span className="text-slate-900 font-bold tabular-nums">
          {value} {pct !== undefined && <span className="text-slate-400 font-normal text-xs">({pct}%)</span>}
        </span>
      </div>
      {pct !== undefined && (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function RatingStars({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className="w-3 h-3"
          fill={s <= Math.round(value) ? '#f59e0b' : 'none'}
          stroke={s <= Math.round(value) ? '#f59e0b' : '#d1d5db'} />
      ))}
    </div>
  );
}

const CATEGORY_COLORS = {
  sanitation: '#06b6d4', security: '#f59e0b', environment: '#10b981',
  infrastructure: '#6366f1', noise: '#8b5cf6', waste: '#ef4444',
  streetlights: '#f97316', other: '#94a3b8',
};
const TEAM_COLORS = {
  bpso: '#3b82f6', disaster: '#ef4444', bhert: '#10b981', general: '#f59e0b',
};
const STATUS_COLORS = {
  pending: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981',
  rejected: '#ef4444', processing: '#6366f1', approved: '#10b981',
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');

  // Raw stats
  const [overview, setOverview] = useState({});
  const [reportsByCategory, setReportsByCategory] = useState([]);
  const [reportsByStatus, setReportsByStatus] = useState([]);
  const [reportsByPriority, setReportsByPriority] = useState([]);
  const [emergenciesByType, setEmergenciesByType] = useState([]);
  const [emergenciesBySeverity, setEmergenciesBySeverity] = useState([]);
  const [serviceByType, setServiceByType] = useState([]);
  const [serviceByStatus, setServiceByStatus] = useState([]);
  const [responderTeams, setResponderTeams] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({});
  const [trendSeries, setTrendSeries] = useState([]);
  const [trendLabels, setTrendLabels] = useState([]);
  const [hourData, setHourData] = useState(Array(24).fill(0));
  const [resolutionTimes, setResolutionTimes] = useState({ reports: 0, emergencies: 0 });
  const [weekDelta, setWeekDelta] = useState(0);
  const [userStats, setUserStats] = useState({});

  const getStartDate = useCallback((range) => {
    const now = new Date();
    if (range === '7days') return new Date(now - 7 * 86400000);
    if (range === '30days') return new Date(now - 30 * 86400000);
    if (range === '90days') return new Date(now - 90 * 86400000);
    return new Date('2020-01-01');
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    try {
      const startDate = getStartDate(timeRange);
      const iso = startDate.toISOString();

      // Separate 14-day window for accurate weekly delta regardless of timeRange
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
      const sevenDaysAgo    = new Date(Date.now() -  7 * 86400000).toISOString();

      const [
        { data: reports,        error: rErr   },
        { data: emergencies,    error: eErr   },
        { data: responders,     error: respErr },
        { data: serviceReqs,    error: sErr   },
        { data: feedback,       error: fErr   },
        { data: users,          error: uErr   },
        // Lightweight delta fetches — only need id + created_at
        { data: deltaReports,   error: drErr  },
        { data: deltaEmerg,     error: deErr  },
      ] = await Promise.all([
        supabase.from('reports').select('*').gte('created_at', iso),
        supabase.from('emergencies').select('*').gte('created_at', iso),
        supabase.from('responders').select('*'),
        supabase.from('service_requests').select('*').gte('created_at', iso),
        supabase.from('responder_feedback').select('*'),
        // Bug 1 fix: include is_banned
        supabase.from('users').select('id, account_type, account_status, verification_status, created_at, is_banned'),
        // Bug 2 fix: independent 14-day window for delta
        supabase.from('reports').select('id, created_at').gte('created_at', fourteenDaysAgo),
        supabase.from('emergencies').select('id, created_at').gte('created_at', fourteenDaysAgo),
      ]);

      // Surface any RLS / network errors so they're visible
      const errs = [
        rErr && `reports: ${rErr.message}`,
        eErr && `emergencies: ${eErr.message}`,
        respErr && `responders: ${respErr.message}`,
        sErr && `service_requests: ${sErr.message}`,
        fErr && `feedback: ${fErr.message}`,
        uErr && `users: ${uErr.message}`,
      ].filter(Boolean);
      if (errs.length) {
        console.error('Analytics query errors:', errs);
        setQueryError(errs.join(' · '));
      }

      const R    = reports     || [];
      const E    = emergencies || [];
      const S    = serviceReqs || [];
      const F    = feedback    || [];
      const U    = users       || [];
      const RESP = responders  || [];

      // ── OVERVIEW KPIs ──
      const totalIncidents = R.length + E.length;
      const resolvedR = R.filter(r => r.status === 'resolved').length;
      const resolvedE = E.filter(e => e.status === 'resolved').length;
      const resolutionRate = totalIncidents > 0
        ? Math.round(((resolvedR + resolvedE) / totalIncidents) * 100) : 0;

      const activeResp      = RESP.filter(r => r.status === 'available').length;
      const pendingServices = S.filter(s => s.status === 'pending').length;
      const avgFeedback     = F.length
        ? (F.reduce((acc, f) => acc + f.rating, 0) / F.length).toFixed(1) : 0;

      // Avg resolution time in minutes
      const calcAvgMin = (items, resKey) => {
        const resolved = items.filter(i => i.status === 'resolved' && i[resKey]);
        if (!resolved.length) return 0;
        const total = resolved.reduce((acc, i) => {
          const diff = (new Date(i[resKey]) - new Date(i.created_at)) / 60000;
          return acc + Math.min(Math.max(diff, 0), 10080);
        }, 0);
        return Math.round(total / resolved.length);
      };
      setResolutionTimes({
        reports:     calcAvgMin(R, 'resolved_at'),
        emergencies: calcAvgMin(E, 'completed_at'),
      });

      // Bug 2 fix: weekly delta from independent 14-day data
      const allDelta = [...(deltaReports || []), ...(deltaEmerg || [])];
      const thisWkCount = allDelta.filter(i => i.created_at >= sevenDaysAgo).length;
      const prevWkCount = allDelta.filter(i => i.created_at >= fourteenDaysAgo && i.created_at < sevenDaysAgo).length;
      setWeekDelta(
        prevWkCount === 0
          ? (thisWkCount > 0 ? 100 : 0)
          : Math.round(((thisWkCount - prevWkCount) / prevWkCount) * 100)
      );

      setOverview({
        totalIncidents, resolutionRate, activeResp,
        pendingServices, avgFeedback,
        totalReports: R.length, totalEmergencies: E.length,
        totalFeedback: F.length, totalService: S.length,
      });

      // ── REPORTS BREAKDOWN ──
      const catCounts = {};
      R.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      setReportsByCategory(
        Object.entries(catCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] || '#94a3b8' }))
      );

      const statCounts = {};
      R.forEach(r => { statCounts[r.status] = (statCounts[r.status] || 0) + 1; });
      setReportsByStatus(
        Object.entries(statCounts).map(([label, value]) => ({
          label, value, color: STATUS_COLORS[label] || '#94a3b8',
        }))
      );

      const priCounts = {};
      R.forEach(r => { priCounts[r.priority] = (priCounts[r.priority] || 0) + 1; });
      const priColors = { low: '#10b981', medium: '#3b82f6', high: '#f97316', urgent: '#ef4444' };
      setReportsByPriority(
        ['urgent', 'high', 'medium', 'low']
          .filter(p => priCounts[p])
          .map(label => ({ label, value: priCounts[label] || 0, color: priColors[label] }))
      );

      // ── EMERGENCIES BREAKDOWN ──
      const typeCounts = {};
      E.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
      const emColors = ['#ef4444','#f97316','#f59e0b','#6366f1','#8b5cf6','#3b82f6','#10b981','#94a3b8'];
      setEmergenciesByType(
        Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value], i) => ({ label, value, color: emColors[i % emColors.length] }))
      );

      const sevCounts = {};
      E.forEach(e => { sevCounts[e.severity || 'high'] = (sevCounts[e.severity || 'high'] || 0) + 1; });
      const sevColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' };
      setEmergenciesBySeverity(
        Object.entries(sevCounts).map(([label, value]) => ({
          label, value, color: sevColors[label] || '#94a3b8',
        }))
      );

      // ── SERVICE REQUESTS ──
      const svcTypeCounts = {};
      S.forEach(s => { svcTypeCounts[s.service_type] = (svcTypeCounts[s.service_type] || 0) + 1; });
      const svcColors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];
      const svcLabels = {
        barangay_id: 'Brgy ID', barangay_clearance: 'Clearance',
        certificate_indigency: 'Indigency', business_clearance: 'Business',
        permit_to_roast: 'Roast Permit',
      };
      setServiceByType(
        Object.entries(svcTypeCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value], i) => ({
            label: svcLabels[label] || label, value, color: svcColors[i % svcColors.length],
          }))
      );

      const svcStatCounts = {};
      S.forEach(s => { svcStatCounts[s.status] = (svcStatCounts[s.status] || 0) + 1; });
      setServiceByStatus(
        Object.entries(svcStatCounts).map(([label, value]) => ({
          label, value, color: STATUS_COLORS[label] || '#94a3b8',
        }))
      );

      // ── RESPONDER TEAMS ──
      const teamCounts = {};
      const teamAvail  = {};
      RESP.forEach(r => {
        const t = r.team || 'general';
        teamCounts[t] = (teamCounts[t] || 0) + 1;
        if (r.status === 'available') teamAvail[t] = (teamAvail[t] || 0) + 1;
      });
      setResponderTeams(
        Object.entries(teamCounts).map(([team, total]) => ({
          team, total, available: teamAvail[team] || 0,
          color: TEAM_COLORS[team] || '#94a3b8',
        }))
      );

      // ── FEEDBACK STATS ──
      if (F.length) {
        const withRT   = F.filter(f => f.response_time);
        const withProf = F.filter(f => f.professionalism);
        const withRes  = F.filter(f => f.resolution);
        setFeedbackStats({
          avgRating:        F.reduce((acc, f) => acc + f.rating, 0) / F.length,
          avgResponseTime:  withRT.length   ? withRT.reduce((acc, f)   => acc + f.response_time, 0)   / withRT.length   : 0,
          avgProfessionalism: withProf.length ? withProf.reduce((acc, f) => acc + f.professionalism, 0) / withProf.length : 0,
          avgResolution:    withRes.length  ? withRes.reduce((acc, f)  => acc + f.resolution, 0)      / withRes.length  : 0,
          dist:  [1,2,3,4,5].map(n => ({ star: n, count: F.filter(f => f.rating === n).length })),
          total: F.length,
        });
      } else {
        setFeedbackStats({ avgRating: 0, avgResponseTime: 0, avgProfessionalism: 0, avgResolution: 0, dist: [], total: 0 });
      }

      // ── TIME SERIES ──
      // Bug 3 fix: use monthly buckets for 'all', daily for bounded ranges
      const buildTimeSeries = () => {
        const labels = [], rS = [], eS = [], sS = [];

        if (timeRange === 'all') {
          // Find earliest record across all datasets
          const allDates = [...R, ...E, ...S]
            .map(i => i.created_at?.slice(0, 7))
            .filter(Boolean)
            .sort();
          if (!allDates.length) return { labels, rS, eS, sS };

          const firstMonth = allDates[0]; // 'YYYY-MM'
          const now        = new Date();
          let   cursor     = new Date(`${firstMonth}-01`);

          while (cursor <= now) {
            const ym = cursor.toISOString().slice(0, 7);
            labels.push(ym.slice(2)); // 'YY-MM'
            rS.push(R.filter(r => r.created_at?.slice(0, 7) === ym).length);
            eS.push(E.filter(e => e.created_at?.slice(0, 7) === ym).length);
            sS.push(S.filter(s => s.created_at?.slice(0, 7) === ym).length);
            cursor.setMonth(cursor.getMonth() + 1);
          }
        } else {
          // Daily buckets — iterate from startDate to today
          const totalDays = Math.ceil((Date.now() - startDate.getTime()) / 86400000);
          for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const ds = d.toISOString().slice(0, 10);
            labels.push(ds.slice(5)); // 'MM-DD'
            rS.push(R.filter(r => r.created_at?.slice(0, 10) === ds).length);
            eS.push(E.filter(e => e.created_at?.slice(0, 10) === ds).length);
            sS.push(S.filter(s => s.created_at?.slice(0, 10) === ds).length);
          }
        }
        return { labels, rS, eS, sS };
      };

      const { labels, rS, eS, sS } = buildTimeSeries();
      setTrendLabels(labels);
      setTrendSeries([
        { label: 'Reports',      data: rS, color: '#3b82f6' },
        { label: 'Emergencies',  data: eS, color: '#ef4444' },
        { label: 'Service Reqs', data: sS, color: '#10b981' },
      ]);

      // ── PEAK HOURS ──
      const hours = Array(24).fill(0);
      [...R, ...E].forEach(item => {
        if (item.created_at) hours[new Date(item.created_at).getHours()]++;
      });
      setHourData(hours);

      // ── USER STATS ── (Bug 1 fix: is_banned now selected)
      const newUsers = U.filter(u => new Date(u.created_at) >= startDate).length;
      setUserStats({
        totalUsers:      U.length,
        residents:       U.filter(u => u.account_type === 'resident').length,
        responderCount:  U.filter(u => u.account_type === 'responder').length,
        admins:          U.filter(u => u.account_type === 'admin').length,
        verified:        U.filter(u => u.verification_status === 'approved').length,
        pendingVerif:    U.filter(u => u.verification_status === 'pending').length,
        banned:          U.filter(u => u.is_banned === true).length,
        newUsers,
      });

    } catch (err) {
      console.error('Analytics error:', err);
      setQueryError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, getStartDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Incidents', overview.totalIncidents],
      ['Total Reports', overview.totalReports],
      ['Total Emergencies', overview.totalEmergencies],
      ['Resolution Rate (%)', overview.resolutionRate],
      ['Active Responders', overview.activeResp],
      ['Pending Service Requests', overview.pendingServices],
      ['Avg Feedback Rating', overview.avgFeedback],
      ['Avg Report Resolution Time (min)', resolutionTimes.reports],
      ['Avg Emergency Resolution Time (min)', resolutionTimes.emergencies],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const formatMin = (m) => {
    if (!m) return '—';
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const totalCat = reportsByCategory.reduce((s, c) => s + c.value, 0) || 1;
  const totalSvc = serviceByType.reduce((s, c) => s + c.value, 0) || 1;

  const RANGES = [
    { key: '7days', label: '7 Days' },
    { key: '30days', label: '30 Days' },
    { key: '90days', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto p-6 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Barangay operations overview · Quezon City
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Time Range */}
            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {RANGES.map(r => (
                <button key={r.key} onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-2 text-xs font-semibold transition-colors
                    ${timeRange === r.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200
                rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50
                shadow-sm disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white
                rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* ── QUERY ERROR BANNER ── */}
        {queryError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">One or more data sources failed to load</p>
              <p className="text-red-600 mt-0.5">{queryError}</p>
              <p className="text-red-500 text-xs mt-1">Check your Supabase RLS policies and ensure the analytics role has SELECT access to all tables.</p>
            </div>
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard icon={Activity} label="Total Incidents"
            value={loading ? '—' : overview.totalIncidents ?? 0}
            sub={`${overview.totalReports ?? 0} reports · ${overview.totalEmergencies ?? 0} emergencies`}
            trend={weekDelta} color="blue" loading={loading} />
          <KPICard icon={CheckCircle} label="Resolution Rate"
            value={loading ? '—' : `${overview.resolutionRate ?? 0}%`}
            sub="Reports + emergencies combined" color="green" loading={loading} />
          <KPICard icon={Clock} label="Avg Resolution"
            value={loading ? '—' : formatMin(resolutionTimes.reports)}
            sub={`Emergencies: ${formatMin(resolutionTimes.emergencies)}`}
            color="purple" loading={loading} />
          <KPICard icon={Shield} label="Active Responders"
            value={loading ? '—' : overview.activeResp ?? 0}
            sub="Currently available" color="orange" loading={loading} />
          <KPICard icon={Package} label="Service Requests"
            value={loading ? '—' : overview.pendingServices ?? 0}
            sub={`Pending · ${overview.totalService ?? 0} total`}
            color="slate" loading={loading} />
          <KPICard icon={Star} label="Avg Satisfaction"
            value={loading ? '—' : overview.avgFeedback ?? '—'}
            sub={`From ${overview.totalFeedback ?? 0} ratings`}
            color="orange" loading={loading} />
        </div>

        {/* ── TREND CHART ── */}
        <SectionCard title="Incident Trends Over Time" icon={TrendingUp} iconColor="text-blue-500">
          <div className="flex items-center gap-4 mb-3">
            {trendSeries.map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          <LineChart series={trendSeries} height={180} />
          {trendLabels.length > 0 && (
            <div className="flex justify-between mt-1 px-7">
              <span className="text-xs text-slate-400">{trendLabels[0]}</span>
              <span className="text-xs text-slate-400">{trendLabels[trendLabels.length - 1]}</span>
            </div>
          )}
        </SectionCard>

        {/* ── REPORTS + EMERGENCIES ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Reports by Category */}
          <SectionCard title="Reports by Category" icon={FileText} iconColor="text-cyan-500">
            <div className="space-y-3">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="space-y-1 animate-pulse">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-1.5 bg-slate-100 rounded w-full" />
                  </div>
                ))
              ) : reportsByCategory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No report data</p>
              ) : (
                reportsByCategory.map((c, i) => (
                  <StatRow key={i} label={c.label} value={c.value}
                    pct={Math.round((c.value / totalCat) * 100)}
                    color={c.color} />
                ))
              )}
            </div>
          </SectionCard>

          {/* Reports by Status + Priority */}
          <SectionCard title="Report Status & Priority" icon={Target} iconColor="text-indigo-500">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Status</p>
                <div className="flex items-center gap-4">
                  <DonutChart data={reportsByStatus} size={90} />
                  <div className="flex-1 space-y-1.5">
                    {reportsByStatus.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 capitalize text-slate-600">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }} />
                          {s.label}
                        </span>
                        <span className="font-bold text-slate-800">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-50 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Priority</p>
                <div className="space-y-2">
                  {reportsByPriority.map((p, i) => {
                    const total = reportsByPriority.reduce((s, x) => s + x.value, 0) || 1;
                    return (
                      <StatRow key={i} label={p.label} value={p.value}
                        pct={Math.round((p.value / total) * 100)} color={p.color} />
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Emergencies */}
          <SectionCard title="Emergency Incidents" icon={Ambulance} iconColor="text-red-500">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">By Type</p>
                <BarChart data={emergenciesByType} color="#ef4444" height={120} />
              </div>
              <div className="border-t border-slate-50 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Severity</p>
                <div className="flex gap-3 flex-wrap">
                  {emergenciesBySeverity.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 px-3 py-2
                      rounded-xl border border-slate-100 min-w-[60px] text-center">
                      <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
                      <span className="text-xs text-slate-500 capitalize">{s.label}</span>
                    </div>
                  ))}
                  {emergenciesBySeverity.length === 0 && (
                    <p className="text-sm text-slate-400">No data</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── SERVICE REQUESTS + FEEDBACK ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Service Requests */}
          <SectionCard title="Service Requests" icon={Package} iconColor="text-emerald-500">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Type</p>
                <div className="space-y-3">
                  {serviceByType.length === 0
                    ? <p className="text-sm text-slate-400">No data</p>
                    : serviceByType.map((s, i) => (
                      <StatRow key={i} label={s.label} value={s.value}
                        pct={Math.round((s.value / totalSvc) * 100)} color={s.color} />
                    ))
                  }
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Status</p>
                <div className="flex flex-col items-center gap-3">
                  <DonutChart data={serviceByStatus} size={100} />
                  <div className="space-y-1 w-full">
                    {serviceByStatus.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 capitalize text-slate-600">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.label}
                        </span>
                        <span className="font-bold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Responder Feedback */}
          <SectionCard title="Responder Feedback & Ratings" icon={MessageSquare} iconColor="text-amber-500">
            {feedbackStats.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <Star className="w-8 h-8" />
                <p className="text-sm">No feedback submitted yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Left: overall rating */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900">
                    {(feedbackStats.avgRating || 0).toFixed(1)}
                  </span>
                  <RatingStars value={feedbackStats.avgRating || 0} />
                  <p className="text-xs text-slate-400">{feedbackStats.total} reviews</p>
                  <div className="w-full space-y-1 mt-2">
                    {(feedbackStats.dist || []).slice().reverse().map(({ star, count }) => {
                      const pct = feedbackStats.total
                        ? Math.round((count / feedbackStats.total) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-right text-slate-500">{star}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-slate-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Right: sub-ratings */}
                <div className="space-y-4">
                  {[
                    { label: 'Response Time', val: feedbackStats.avgResponseTime },
                    { label: 'Professionalism', val: feedbackStats.avgProfessionalism },
                    { label: 'Resolution', val: feedbackStats.avgResolution },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className="font-bold text-slate-800">{(val || 0).toFixed(1)}/5</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${((val || 0) / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-50 pt-3 mt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Satisfaction Band
                    </p>
                    {(() => {
                      const avg = feedbackStats.avgRating || 0;
                      const level = avg >= 4.5 ? { label: 'Excellent', color: '#10b981' }
                        : avg >= 3.5 ? { label: 'Good', color: '#3b82f6' }
                        : avg >= 2.5 ? { label: 'Fair', color: '#f59e0b' }
                        : { label: 'Needs Improvement', color: '#ef4444' };
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: level.color }}>
                          {level.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── RESPONDER TEAMS + USER STATS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Responder Teams */}
          <SectionCard title="Responder Team Breakdown" icon={Shield} iconColor="text-blue-500">
            {responderTeams.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No responder data</p>
            ) : (
              <div className="space-y-4">
                {responderTeams.map((t, i) => {
                  const availPct = t.total > 0 ? Math.round((t.available / t.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm font-bold mb-1">
                          <span className="uppercase text-slate-700">{t.team}</span>
                          <span className="text-slate-900">{t.total} total</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${availPct}%`, backgroundColor: t.color }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.available} available ({availPct}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-slate-50 pt-3 flex gap-2 flex-wrap">
                  {responderTeams.map(t => (
                    <div key={t.team} className="text-center px-3 py-2 rounded-xl border border-slate-100">
                      <p className="text-lg font-black" style={{ color: t.color }}>{t.total}</p>
                      <p className="text-xs text-slate-500 uppercase">{t.team}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* User Statistics */}
          <SectionCard title="User Statistics" icon={Users} iconColor="text-purple-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Types</p>
                <StatRow label="Residents" value={userStats.residents || 0}
                  pct={userStats.totalUsers ? Math.round((userStats.residents || 0) / userStats.totalUsers * 100) : 0}
                  color="#6366f1" />
                <StatRow label="Responders" value={userStats.responderCount || 0}
                  pct={userStats.totalUsers ? Math.round((userStats.responderCount || 0) / userStats.totalUsers * 100) : 0}
                  color="#3b82f6" />
                <StatRow label="Admins" value={userStats.admins || 0}
                  pct={userStats.totalUsers ? Math.round((userStats.admins || 0) / userStats.totalUsers * 100) : 0}
                  color="#8b5cf6" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification</p>
                <div className="space-y-2">
                  {[
                    { label: 'Verified', value: userStats.verified || 0, color: '#10b981' },
                    { label: 'Pending', value: userStats.pendingVerif || 0, color: '#f59e0b' },
                    { label: 'Banned', value: userStats.banned || 0, color: '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </span>
                      <span className="font-bold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">New this period</span>
                    <span className="text-sm font-black text-blue-600">+{userStats.newUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">Total users</span>
                    <span className="text-sm font-black text-slate-800">{userStats.totalUsers || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── PEAK HOURS HEATMAP ── */}
        <SectionCard title="Peak Activity Hours" icon={Calendar} iconColor="text-orange-500"
          action={
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-900 inline-block" /> Peak
              </span>
            </div>
          }>
          <HeatmapGrid hourData={hourData} />
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {hourData.map((c, h) => c).reduce((max, c) => Math.max(max, c), 0) > 0 && (
              <>
                <span>Busiest hour: <strong className="text-slate-700">
                  {hourData.indexOf(Math.max(...hourData))}:00
                </strong></span>
                <span>·</span>
                <span>Peak count: <strong className="text-slate-700">{Math.max(...hourData)}</strong> incidents</span>
              </>
            )}
          </div>
        </SectionCard>

        {/* ── BOTTOM SUMMARY STRIP ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50',
              label: 'Report Avg Resolution', value: formatMin(resolutionTimes.reports)
            },
            {
              icon: Ambulance, color: 'text-red-600', bg: 'bg-red-50',
              label: 'Emergency Avg Resolution', value: formatMin(resolutionTimes.emergencies)
            },
            {
              icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50',
              label: 'Verified Users', value: `${userStats.verified || 0}`
            },
            {
              icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50',
              label: 'Feedback Collected', value: `${feedbackStats.total || 0}`
            },
          ].map(({ icon: Icon, color, bg, label, value }, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-lg font-black text-slate-900">{loading ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}