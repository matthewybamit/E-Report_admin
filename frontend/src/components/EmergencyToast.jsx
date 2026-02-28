// src/components/EmergencyToast.jsx
import { useEffect, useState } from 'react';
import { X, Ambulance, Flame, Shield, AlertTriangle, MapPin, ExternalLink } from 'lucide-react';

const TYPE_CONFIG = {
  Medical:  { icon: Ambulance,      bg: 'bg-red-600',    ring: 'ring-red-400'    },
  Fire:     { icon: Flame,          bg: 'bg-orange-600', ring: 'ring-orange-400' },
  Crime:    { icon: Shield,         bg: 'bg-purple-600', ring: 'ring-purple-400' },
  Accident: { icon: AlertTriangle,  bg: 'bg-yellow-600', ring: 'ring-yellow-400' },
};

export default function EmergencyToast({ emergency, onDismiss, onView }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const cfg  = TYPE_CONFIG[emergency?.type] || TYPE_CONFIG.Accident;
  const Icon = cfg.icon;

  // Slide in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    const t = setTimeout(() => handleDismiss(), 12000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(emergency.id), 300);
  };

  return (
    <div
      className={`
        w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden
        ring-2 ${cfg.ring}
        transition-all duration-300
        ${visible && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Header */}
      <div className={`${cfg.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest">
              🚨 New Emergency
            </p>
            <p className="text-white/90 text-sm font-bold">{emergency.type} Emergency</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-slate-700 leading-snug line-clamp-2">
          {emergency.description || 'Emergency reported — immediate attention required.'}
        </p>
        {(emergency.location_text || emergency.latitude) && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
            {emergency.location_text ||
              `${emergency.latitude?.toFixed(5)}, ${emergency.longitude?.toFixed(5)}`}
          </p>
        )}
        <p className="text-xs text-slate-400">
          {new Date(emergency.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => { onView(emergency); handleDismiss(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${cfg.bg} hover:opacity-90 text-white rounded text-xs font-bold transition-all`}
        >
          <ExternalLink className="w-3.5 h-3.5" />View & Respond
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold transition-all"
        >
          Dismiss
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className={`h-1 ${cfg.bg} opacity-30`}>
        <div
          className={`h-full ${cfg.bg} opacity-100`}
          style={{ animation: 'shrink 12s linear forwards' }}
        />
      </div>
    </div>
  );
}
