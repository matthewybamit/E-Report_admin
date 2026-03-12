// src/pages/Verify.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC certificate verification page — zero authentication required.
// QR codes on certificates link to:  https://your-app.vercel.app/verify/:id
//
// Add to your React Router config (src/App.jsx or equivalent):
//   <Route path="/verify/:id" element={<Verify />} />
//
// This page relies on the Supabase anon key and the RLS policy added in
// services_v2_migration.sql, which exposes only approved+issued rows.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../config/supabase";

const SERVICE_LABELS = {
  barangay_id:           "Barangay ID",
  barangay_clearance:    "Barangay Clearance",
  certificate_indigency: "Certificate of Indigency",
  business_clearance:    "Business Clearance",
  permit_to_roast:       "Barangay Clearance Permit (Permit to Roast)",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Verify() {
  const { id }  = useParams();
  const [cert,  setCert]   = useState(null);
  const [phase, setPhase]  = useState("loading"); // loading | valid | invalid | error

  useEffect(() => {
    if (!id) { setPhase("invalid"); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("service_requests")
          .select(
            "id, control_number, full_name, service_title, service_type, " +
            "processed_at, status, processed_by, address, purpose, photo_2x2_url"
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data || data.status !== "approved") { setPhase("invalid"); return; }
        setCert(data);
        setPhase("valid");
      } catch (e) {
        console.error("Verify error:", e);
        setPhase("error");
      }
    })();
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center py-16">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Verifying certificate…</p>
        </div>
      </Shell>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <Shell>
        <StatusCard color="amber" icon="⚠️" headline="Verification Error"
          body="Could not connect to the verification server. Please try again later." />
      </Shell>
    );
  }

  // ── Not found / revoked ───────────────────────────────────────────────────
  if (phase === "invalid") {
    return (
      <Shell>
        <StatusCard color="red" icon="❌" headline="Certificate Not Found"
          body="This certificate could not be verified. It may be invalid, revoked, or does not exist in our records." />
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2">What this means:</p>
          <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
            <li>The certificate ID does not match any issued document</li>
            <li>The certificate may have been revoked or cancelled</li>
            <li>The QR code may have been altered or tampered with</li>
          </ul>
          {id && (
            <p className="text-xs text-red-400 mt-3 font-mono break-all">
              Ref: {id}
            </p>
          )}
        </div>
      </Shell>
    );
  }

  // ── Valid ─────────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Valid banner */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-center mb-6 shadow-lg">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Certificate Verified</h2>
        <p className="text-green-100 text-sm mt-1">This certificate is authentic and on record.</p>
      </div>

      {/* Certificate details */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">

        {/* Header strip */}
        <div className="bg-slate-800 px-5 py-4 flex items-start gap-4">
          {cert.photo_2x2_url && (
            <img src={cert.photo_2x2_url} alt="Certificate holder"
              className="w-16 h-16 object-cover rounded-lg border-2 border-slate-600 shrink-0" />
          )}
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Control Number</p>
            <p className="text-xl font-bold text-green-400 font-mono tracking-wider">{cert.control_number}</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <Row label="Certificate Type" value={SERVICE_LABELS[cert.service_type] || cert.service_title} />
          <Row label="Issued To"         value={cert.full_name} large />
          <Row label="Date Issued"        value={fmtDate(cert.processed_at)} />
          {cert.processed_by && <Row label="Processed By" value={cert.processed_by} />}
          {cert.purpose      && <Row label="Purpose"      value={cert.purpose} />}
        </div>

        {/* Authenticity footer */}
        <div className="bg-green-50 border-t border-green-200 px-5 py-3 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
          <p className="text-xs font-semibold text-green-800">
            Verified against Barangay Salvacion official records
          </p>
        </div>
      </div>

      {/* Barangay info */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Barangay Salvacion</p>
        <p className="text-xs text-slate-500">74 Bulusan Street, La Loma, Quezon City</p>
        <p className="text-xs text-slate-400 mt-0.5">8-742-0944 / 0920-433-1754</p>
        <p className="text-xs text-slate-300 mt-3 font-mono break-all">Ref: {cert.id}</p>
      </div>
    </Shell>
  );
}

// ── Layout wrapper ────────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        {/* Letterhead */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Certificate Verification
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Barangay Salvacion</h1>
          <p className="text-sm text-slate-500 mt-0.5">Official Records System</p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Status card (error/invalid states) ───────────────────────────────────────
function StatusCard({ color, icon, headline, body }) {
  const t = {
    red:   { wrap: "bg-red-50 border-red-200",     h: "text-red-800",   b: "text-red-600"   },
    amber: { wrap: "bg-amber-50 border-amber-200", h: "text-amber-800", b: "text-amber-600" },
  }[color];
  return (
    <div className={`border rounded-2xl p-6 text-center ${t.wrap}`}>
      <div className="text-5xl mb-3">{icon}</div>
      <h2 className={`text-xl font-extrabold mb-2 ${t.h}`}>{headline}</h2>
      <p className={`text-sm ${t.b}`}>{body}</p>
    </div>
  );
}

// ── Single detail row ─────────────────────────────────────────────────────────
function Row({ label, value, large = false }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`font-semibold text-slate-800 ${large ? "text-lg" : "text-sm"}`}>{value || "—"}</p>
    </div>
  );
}