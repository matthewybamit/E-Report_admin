// src/pages/Feedback.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import {
  Star, Search, RefreshCw, X, ChevronDown,
  Users, BarChart2, TrendingUp, MessageSquare,
  Calendar, MapPin, Tag, Filter, Award,
  ThumbsUp, ThumbsDown, Minus, Eye,
  Shield, Zap, Activity,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const TEAM_CONFIG = {
  bpso:     { label:'BPSO',              color:'bg-blue-50 text-blue-700 border-blue-300'        },
  disaster: { label:'Disaster Response', color:'bg-orange-50 text-orange-700 border-orange-300'  },
  bhert:    { label:'BHERT',             color:'bg-green-50 text-green-700 border-green-300'     },
  general:  { label:'General Response',  color:'bg-slate-50 text-slate-600 border-slate-300'     },
};

const CATEGORY_LABELS = {
  security:'Security', infrastructure:'Infrastructure', sanitation:'Sanitation',
  environment:'Environment', noise:'Noise', waste:'Waste', streetlights:'Streetlights', other:'Other',
};

function StarDisplay({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={`${sz} ${s<=rating ? 'text-amber-400':'text-slate-200'}`}>★</span>
      ))}
    </span>
  );
}

function RatingBadge({ rating }) {
  const cfg =
    rating >= 4.5 ? { color:'bg-green-50 text-green-700 border-green-300',   icon:ThumbsUp,   label:'Excellent' } :
    rating >= 3.5 ? { color:'bg-blue-50 text-blue-700 border-blue-300',      icon:ThumbsUp,   label:'Good'      } :
    rating >= 2.5 ? { color:'bg-amber-50 text-amber-700 border-amber-300',   icon:Minus,      label:'Average'   } :
                    { color:'bg-red-50 text-red-700 border-red-300',          icon:ThumbsDown, label:'Poor'      };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function SubRatingBar({ label, value }) {
  if (!value) return null;
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-blue-500' : value >= 2 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-28 font-medium flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div style={{ width:`${pct}%` }} className={`h-full ${color} rounded-full`} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-6 text-right">{value}/5</span>
    </div>
  );
}

// ─── Feedback Detail Modal ─────────────────────────────────────────────────────
function FeedbackDetailModal({ feedback, onClose }) {
  if (!feedback) return null;
  const team = TEAM_CONFIG[feedback.responder_team] || TEAM_CONFIG.general;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Feedback Detail</h2>
            <p className="text-xs text-slate-400 mt-0.5">{feedback.report_number || feedback.id.slice(0,8)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Overall rating */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{feedback.rating.toFixed(1)}</p>
              <StarDisplay rating={feedback.rating} size="lg" />
              <RatingBadge rating={feedback.rating} />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Submitted</p>
              <p className="text-sm font-semibold text-slate-700">
                {new Date(feedback.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
              </p>
            </div>
          </div>

          {/* Responder info */}
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Responding Officer</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(feedback.responder_name||'?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{feedback.responder_name || '—'}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${team.color}`}>
                  {team.label}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-ratings */}
          {(feedback.response_time || feedback.professionalism || feedback.resolution) && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detailed Ratings</p>
              <SubRatingBar label="Response Time"      value={feedback.response_time}   />
              <SubRatingBar label="Professionalism"    value={feedback.professionalism} />
              <SubRatingBar label="Problem Resolution" value={feedback.resolution}      />
            </div>
          )}

          {/* Comment */}
          {feedback.comment && (
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Comment</p>
              <p className="text-sm text-slate-700 leading-relaxed italic">"{feedback.comment}"</p>
            </div>
          )}

          {/* Report info */}
          <div className="border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Report</p>
            <div className="space-y-2">
              {feedback.report_number && (
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-600">{feedback.report_number}</span>
                </div>
              )}
              {feedback.report_title && (
                <div className="flex items-start gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-semibold">{feedback.report_title}</span>
                </div>
              )}
              {feedback.report_category && (
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 capitalize">{CATEGORY_LABELS[feedback.report_category] || feedback.report_category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submitted by */}
          {(feedback.user_name || feedback.user_email) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Submitted by <strong className="text-slate-700">{feedback.user_name || feedback.user_email}</strong></span>
            </div>
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

// ─── Responder Performance Card ────────────────────────────────────────────────
function ResponderPerfCard({ responder }) {
  const team = TEAM_CONFIG[responder.team] || TEAM_CONFIG.general;
  const avg  = responder.avg_rating || 0;
  const fill = (avg / 5) * 100;
  const ringColor = avg >= 4 ? '#10B981' : avg >= 3 ? '#3B82F6' : avg >= 2 ? '#F59E0B' : '#EF4444';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {responder.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{responder.name}</p>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${team.color}`}>
            {team.label}
          </span>
        </div>
        {/* Rating ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="19" fill="none" stroke="#F1F5F9" strokeWidth="5" />
              <circle cx="24" cy="24" r="19" fill="none" stroke={ringColor} strokeWidth="5"
                strokeDasharray={`${2*Math.PI*19}`}
                strokeDashoffset={`${2*Math.PI*19*(1-fill/100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-slate-800">{avg.toFixed(1)}</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">Rating</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
        {[
          { label:'Reviews',  value: responder.total_feedback },
          { label:'5 Stars',  value: responder.five_star      },
          { label:'Avg R.T.', value: responder.avg_response_time ? responder.avg_response_time.toFixed(1) : '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-sm font-black text-slate-800">{value ?? 0}</p>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Feedback() {
  const [feedback,        setFeedback]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [filterTeam,      setFilterTeam]      = useState('all');
  const [filterRating,    setFilterRating]    = useState('all');
  const [filterCategory,  setFilterCategory]  = useState('all');
  const [sortBy,          setSortBy]          = useState('newest');
  const [selectedFeedback,setSelectedFeedback]= useState(null);
  const [activeTab,       setActiveTab]       = useState('feedback'); // 'feedback' | 'performance'

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      // ── Step 1: raw feedback rows ────────────────────────────────────────
      const { data: rawFeedback, error } = await supabase
        .from('responder_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rawFeedback?.length) { setFeedback([]); return; }

      // ── Step 2: collect unique IDs ───────────────────────────────────────
      const reportIds    = [...new Set(rawFeedback.map(f => f.report_id).filter(Boolean))];
      const responderIds = [...new Set(rawFeedback.map(f => f.responder_id).filter(Boolean))];
      const userIds      = [...new Set(rawFeedback.map(f => f.user_id).filter(Boolean))];

      // ── Step 3: parallel lookups (same pattern as my-reports.jsx) ────────
      const [reportsRes, respondersRes, usersRes] = await Promise.all([
        reportIds.length
          ? supabase.from('reports').select('id, report_number, title, category').in('id', reportIds)
          : { data: [] },
        responderIds.length
          ? supabase.from('responders').select('id, name, team').in('id', responderIds)
          : { data: [] },
        userIds.length
          ? supabase.from('users').select('id, full_name, email').in('id', userIds)
          : { data: [] },
      ]);

      // ── Step 4: build lookup maps ─────────────────────────────────────────
      const reportsMap    = Object.fromEntries((reportsRes.data   || []).map(r => [r.id, r]));
      const respondersMap = Object.fromEntries((respondersRes.data|| []).map(r => [r.id, r]));
      const usersMap      = Object.fromEntries((usersRes.data     || []).map(u => [u.id, u]));

      // ── Step 5: merge ─────────────────────────────────────────────────────
      const enriched = rawFeedback.map(f => ({
        id:              f.id,
        rating:          f.rating,
        comment:         f.comment,
        response_time:   f.response_time,
        professionalism: f.professionalism,
        resolution:      f.resolution,
        created_at:      f.created_at,
        responder_id:    f.responder_id,
        // Report
        report_number:   reportsMap[f.report_id]?.report_number || null,
        report_title:    reportsMap[f.report_id]?.title          || null,
        report_category: reportsMap[f.report_id]?.category       || null,
        // Responder (null-safe — responder_id may be null)
        responder_name:  respondersMap[f.responder_id]?.name     || null,
        responder_team:  respondersMap[f.responder_id]?.team     || null,
        // User
        user_name:       usersMap[f.user_id]?.full_name          || null,
        user_email:      usersMap[f.user_id]?.email              || null,
      }));

      setFeedback(enriched);
    } catch (err) {
      console.error('fetchFeedback error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalFeedback = feedback.length;
  const avgRating     = totalFeedback ? (feedback.reduce((s,f) => s+f.rating,0) / totalFeedback) : 0;
  const distribution  = [5,4,3,2,1].map(r => ({
    star:  r,
    count: feedback.filter(f => f.rating===r).length,
    pct:   totalFeedback ? Math.round((feedback.filter(f => f.rating===r).length / totalFeedback)*100) : 0,
  }));

  // ── Responder performance aggregation ──────────────────────────────────────
  const performanceMap = {};
  feedback.forEach(f => {
    if (!f.responder_id) return;
    if (!performanceMap[f.responder_id]) {
      performanceMap[f.responder_id] = {
        id: f.responder_id, name: f.responder_name || '—', team: f.responder_team,
        ratings:[], response_times:[], five_star:0, total_feedback:0,
      };
    }
    const p = performanceMap[f.responder_id];
    p.ratings.push(f.rating);
    p.total_feedback++;
    if (f.rating===5) p.five_star++;
    if (f.response_time) p.response_times.push(f.response_time);
  });

  const responderPerformance = Object.values(performanceMap).map(p => ({
    ...p,
    avg_rating:        p.ratings.length ? p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length : 0,
    avg_response_time: p.response_times.length ? p.response_times.reduce((a,b)=>a+b,0)/p.response_times.length : null,
  })).sort((a,b) => b.avg_rating - a.avg_rating);

  // ── Filter + sort ───────────────────────────────────────────────────────────
  const filtered = feedback.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      f.responder_name?.toLowerCase().includes(q) ||
      f.report_number?.toLowerCase().includes(q)  ||
      f.user_name?.toLowerCase().includes(q)       ||
      f.comment?.toLowerCase().includes(q);
    const matchTeam     = filterTeam     === 'all' || f.responder_team     === filterTeam;
    const matchRating   = filterRating   === 'all' || String(f.rating)     === filterRating;
    const matchCategory = filterCategory === 'all' || f.report_category    === filterCategory;
    return matchSearch && matchTeam && matchRating && matchCategory;
  }).sort((a,b) => {
    if (sortBy==='newest')      return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy==='oldest')      return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy==='highest')     return b.rating - a.rating;
    if (sortBy==='lowest')      return a.rating - b.rating;
    return 0;
  });

  const uniqueCategories = [...new Set(feedback.map(f=>f.report_category).filter(Boolean))];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <Star className="w-3.5 h-3.5" />Feedback &amp; Ratings
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Responder Feedback</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resident ratings and comments for response quality</p>
        </div>
        <button onClick={fetchFeedback} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Reviews',    value: totalFeedback,          icon:MessageSquare, color:'text-slate-700' },
          { label:'Average Rating',   value: avgRating.toFixed(2),   icon:Star,          color:'text-amber-600' },
          { label:'5-Star Reviews',   value: distribution[0].count,  icon:Award,         color:'text-green-600' },
          { label:'Responders Rated', value: responderPerformance.length, icon:Users,   color:'text-blue-600'  },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* Rating distribution + avg */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Big avg display */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overall Average</p>
          <p className="text-6xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
          <StarDisplay rating={Math.round(avgRating)} size="lg" />
          <RatingBadge rating={avgRating} />
          <p className="text-xs text-slate-400">{totalFeedback} review{totalFeedback!==1?'s':''}</p>
        </div>

        {/* Distribution bars */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5" />Rating Distribution
          </p>
          <div className="space-y-3">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-700">{star}</span>
                  <span className="text-amber-400 text-sm">★</span>
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width:`${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      star===5?'bg-green-500': star===4?'bg-emerald-400': star===3?'bg-amber-400': star===2?'bg-orange-400':'bg-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 w-20 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-700">{count}</span>
                  <span className="text-xs text-slate-400">({pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex gap-1.5 w-fit">
        {[
          { id:'feedback',    label:'All Feedback',       icon:MessageSquare },
          { id:'performance', label:'Responder Performance', icon:TrendingUp    },
        ].map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
              activeTab===id ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' ? (
        // ── Performance tab ──────────────────────────────────────────────────
        <div>
          {responderPerformance.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">No performance data yet</p>
              <p className="text-sm text-slate-400 mt-1">Feedback will appear here once residents submit ratings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {responderPerformance.map(r => (
                <ResponderPerfCard key={r.id} responder={r} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── Feedback tab ─────────────────────────────────────────────────────
        <>
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by responder, report, or comment..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none font-semibold">
                <option value="all">All Teams</option>
                {Object.entries(TEAM_CONFIG).map(([v,t]) => <option key={v} value={v}>{t.label}</option>)}
              </select>
              <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none font-semibold">
                <option value="all">All Ratings</option>
                {[5,4,3,2,1].map(r => <option key={r} value={String(r)}>{r} ★</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none font-semibold">
                <option value="all">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]||c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none font-semibold">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
              <span className="text-xs text-slate-400 ml-auto">
                <strong className="text-slate-600">{filtered.length}</strong> of {totalFeedback}
              </span>
            </div>
          </div>

          {/* Feedback list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">No feedback found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => {
                const team = TEAM_CONFIG[f.responder_team] || TEAM_CONFIG.general;
                return (
                  <div key={f.id}
                    className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-4 flex items-start gap-4">
                      {/* Responder avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(f.responder_name||'?').charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{f.responder_name || '—'}</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${team.color}`}>
                              {team.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StarDisplay rating={f.rating} size="md" />
                            <span className="text-sm font-black text-slate-800">{f.rating}/5</span>
                            <RatingBadge rating={f.rating} />
                          </div>
                        </div>

                        {f.comment && (
                          <p className="mt-2 text-sm text-slate-600 italic leading-relaxed line-clamp-2">
                            "{f.comment}"
                          </p>
                        )}

                        {/* Sub-ratings inline */}
                        {(f.response_time || f.professionalism || f.resolution) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[
                              { label:'Response', value:f.response_time   },
                              { label:'Prof.',    value:f.professionalism },
                              { label:'Resolution',value:f.resolution     },
                            ].filter(s=>s.value).map(s => (
                              <span key={s.label} className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                                {s.label}: <span className="font-bold text-amber-500">{'★'.repeat(s.value)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {f.report_number && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />{f.report_number}
                            </span>
                          )}
                          {f.report_category && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span className="capitalize">{CATEGORY_LABELS[f.report_category]||f.report_category}</span>
                            </span>
                          )}
                          {f.user_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />{f.user_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3" />
                            {new Date(f.created_at).toLocaleDateString('en-US',{ month:'short',day:'numeric',year:'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* View detail button */}
                      <button onClick={() => setSelectedFeedback(f)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors flex-shrink-0">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                    </div>

                    {/* Color accent bar based on rating */}
                    <div className={`h-1 ${
                      f.rating===5?'bg-green-500': f.rating===4?'bg-emerald-400':
                      f.rating===3?'bg-amber-400': f.rating===2?'bg-orange-400':'bg-red-500'
                    }`} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </div>
  );
}