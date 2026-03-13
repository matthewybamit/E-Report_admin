// src/pages/Services.jsx
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Loader,
  RefreshCw,
  ScrollText,   // replaces Flame — used for Barangay Permit Clearance
  Search,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { logAuditAction } from "../utils/auditLogger";
import {
  generateCertificate,
  hasDocxTemplate,
} from "../utils/generateCertificate";
import leftHeaderImg  from "../assets/QuezonCityLeftSideHeader_Image.png";
import rightHeaderImg from "../assets/SalvacionRightHeader_Image.png";
import { getBase64FromUrl } from "../utils/imageHelpers";

// Cache for header images (load once)
let headerImageCache = null;
const loadHeaderImages = async () => {
  if (headerImageCache) return headerImageCache;
  const left  = await getBase64FromUrl(leftHeaderImg);
  const right = await getBase64FromUrl(rightHeaderImg);
  headerImageCache = { left, right };
  return headerImageCache;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { id: "barangay_id",           label: "Barangay ID",                icon: CreditCard,  color: "bg-blue-50 text-blue-700 border-blue-300"      },
  { id: "barangay_clearance",    label: "Barangay Clearance",         icon: ShieldCheck, color: "bg-green-50 text-green-700 border-green-300"    },
  { id: "certificate_indigency", label: "Certificate of Indigency",   icon: Banknote,    color: "bg-pink-50 text-pink-700 border-pink-300"       },
  { id: "business_clearance",    label: "Business Clearance",         icon: Building2,   color: "bg-teal-50 text-teal-700 border-teal-300"       },
  // DB key stays "permit_to_roast" for constraint compatibility
  { id: "permit_to_roast",       label: "Barangay Permit Clearance",  icon: ScrollText,  color: "bg-violet-50 text-violet-700 border-violet-300" },
];

const STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "bg-slate-50 text-slate-600 border-slate-300",  dot: "bg-slate-400",  icon: Clock        },
  // processing kept for compatibility with existing records, but removed from UI selectors
  processing: { label: "Processing", color: "bg-amber-50 text-amber-700 border-amber-300",  dot: "bg-amber-500",  icon: Loader       },
  approved:   { label: "Approved",   color: "bg-green-50 text-green-700 border-green-300",  dot: "bg-green-500",  icon: CheckCircle  },
  rejected:   { label: "Rejected",   color: "bg-red-50 text-red-700 border-red-300",        dot: "bg-red-500",    icon: XCircle      },
};

const FIELD_LABELS = {
  full_name:         "Full Name",
  address:           "Address",
  date_of_birth:     "Date of Birth",
  place_of_birth:    "Place of Birth",
  gender:            "Gender",
  civil_status:      "Civil Status",
  contact_number:    "Contact Number",
  date_of_residency: "Date of Residency",
  residency_status:  "Residency Status",
  purpose:           "Purpose",
  age:               "Age",
  assistance_type:   "Type of Assistance",
  business_name:     "Business Name",
  business_address:  "Business Address",
  business_type:     "Nature of Business / Activity",
  items_to_roast:    "Items to Roast",       // kept for legacy records
  ctc_no:            "CTC No.",
};

const SERVICE_FIELDS = {
  barangay_id:           ["full_name","address","date_of_birth","place_of_birth","gender","civil_status","contact_number","date_of_residency","purpose"],
  barangay_clearance:    ["full_name","address","date_of_birth","place_of_birth","gender","civil_status","contact_number","date_of_residency","residency_status","ctc_no","purpose"],
  certificate_indigency: ["full_name","address","age","gender","contact_number","purpose","assistance_type"],
  business_clearance:    ["full_name","contact_number","business_name","business_address","business_type","purpose"],
  permit_to_roast:       ["full_name","address","contact_number","business_name","business_address","business_type","purpose"],
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function generateControlNumber(serviceType) {
  const prefix = {
    barangay_id:           "BID",
    barangay_clearance:    "BCL",
    certificate_indigency: "COI",
    business_clearance:    "BCB",
    permit_to_roast:       "BPC",  // Barangay Permit Clearance
  }[serviceType] || "SRV";
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold capitalize tracking-wide ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Service Type Badge ───────────────────────────────────────────────────────
function ServiceTypeBadge({ serviceType }) {
  const cfg = SERVICE_TYPES.find((s) => s.id === serviceType);
  if (!cfg) return <span className="text-xs text-slate-500">{serviceType}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Quick Download Button (table row) ───────────────────────────────────────
function QuickDownloadButton({ request }) {
  const [generating, setGenerating] = useState(false);
  const handleClick = async (e) => {
    e.stopPropagation();
    setGenerating(true);
    try {
      const images = await loadHeaderImages();
      await generateCertificate(request, images);
    } catch (err) {
      alert("Failed to generate: " + err.message);
    } finally {
      setGenerating(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={generating}
      title="Download DOCX certificate"
      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
    >
      {generating ? <Loader className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
    </button>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function StatusTimeline({ currentStatus }) {
  const isRejected = currentStatus === "rejected";

  const stages = isRejected
    ? ["pending", "processing", "rejected"]
    : ["pending", "processing", "approved"];

  const stageConfig = {
    pending:    { label: "Received",   icon: Clock,        color: "bg-slate-400",  ring: "ring-slate-300" },
    processing: { label: "Processing", icon: Loader,       color: "bg-amber-500",  ring: "ring-amber-200" },
    approved:   { label: "Approved",   icon: CheckCircle,  color: "bg-green-500",  ring: "ring-green-200" },
    rejected:   { label: "Rejected",   icon: XCircle,      color: "bg-red-500",    ring: "ring-red-200"   },
  };

  const currentIdx = stages.indexOf(currentStatus);

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {stages.map((stage, i) => {
          const cfg   = stageConfig[stage];
          const Icon  = cfg.icon;
          const done  = i < currentIdx;
          const active = i === currentIdx;

          return (
            <div key={stage} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                  ${active  ? `${cfg.color} ring-4 ${cfg.ring} text-white` : ""}
                  ${done    ? "bg-green-500 text-white" : ""}
                  ${!active && !done ? "bg-white border-2 border-slate-300 text-slate-400" : ""}
                `}>
                  {done ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${active ? "" : "text-slate-400"}`} />}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${active ? "text-slate-800" : done ? "text-green-700" : "text-slate-400"}`}>
                  {cfg.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className={`h-0.5 w-full -mt-5 mx-1 rounded transition-all ${done || (active && i > 0) ? "bg-green-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Verification Panel ───────────────────────────────────────────────────────
function VerificationPanel({ request }) {
  const checks = [
    {
      label:   "Applicant Photo",
      hint:    "2×2 ID photo submitted",
      passed:  !!request.photo_2x2_url,
      link:    request.photo_2x2_url,
      linkLabel: "View Photo",
    },
    {
      label:   "Digital Signature",
      hint:    "Applicant signature on file",
      passed:  !!request.signature_url,
      link:    request.signature_url,
      linkLabel: "View Signature",
    },
    {
      label:   "Purpose Stated",
      hint:    "Applicant provided a purpose",
      passed:  !!(request.purpose?.trim()),
    },
    {
      label:   "Contact Number",
      hint:    "Valid contact number on record",
      passed:  !!(request.contact_number?.trim()),
    },
    ...(request.business_name != null
      ? [{
          label:  "Business Name",
          hint:   "Business/establishment name provided",
          passed: !!(request.business_name?.trim()),
        }]
      : []),
  ];

  const allPassed  = checks.every((c) => c.passed);
  const passCount  = checks.filter((c) => c.passed).length;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />Document Verification
        </p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allPassed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {passCount}/{checks.length} verified
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-3 p-2.5 rounded-lg border ${c.passed ? "bg-green-50 border-green-100" : "bg-slate-50 border-slate-200"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.passed ? "bg-green-500" : "bg-slate-300"}`}>
              {c.passed
                ? <CheckCircle className="w-3 h-3 text-white" />
                : <X className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${c.passed ? "text-green-800" : "text-slate-600"}`}>{c.label}</p>
              <p className="text-xs text-slate-400">{c.hint}</p>
            </div>
            {c.link && c.passed && (
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
              >
                {c.linkLabel}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── View / Process Modal ─────────────────────────────────────────────────────
function RequestModal({ request, onClose, onSave, saving }) {
  const [status,           setStatus]           = useState(request.status);
  const [adminNotes,       setAdminNotes]       = useState(request.admin_notes  || "");
  const [processedBy,      setProcessedBy]      = useState(request.processed_by || "");
  const [rejectionReason,  setRejectionReason]  = useState("");
  const [generating,       setGenerating]       = useState(false);

  if (!request) return null;

  const fields       = SERVICE_FIELDS[request.service_type] || [];
  const isApproving  = status === "approved";
  const isRejecting  = status === "rejected";
  const statusChanged = status !== request.status;

  const handleGenerateDocx = async () => {
    setGenerating(true);
    try {
      const images = await loadHeaderImages();
      await generateCertificate(request, images);
    } catch (err) {
      alert("Failed to generate document: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (isRejecting && !rejectionReason.trim() && !adminNotes.trim()) {
      alert("Please provide a rejection reason before rejecting this request.");
      return;
    }
    const finalNotes = isRejecting && rejectionReason.trim()
      ? `Rejection Reason: ${rejectionReason}${adminNotes.trim() ? `\n\n${adminNotes}` : ""}`
      : adminNotes;

    onSave(request.id, {
      status,
      admin_notes:  finalNotes,
      processed_by: processedBy,
      processed_at: status !== "pending" ? new Date().toISOString() : null,
      control_number:
        isApproving && !request.control_number
          ? generateControlNumber(request.service_type)
          : request.control_number,
    });
  };

  // Button appearance varies by selected status
  const saveBtn = isApproving
    ? { label: "Approve & Save", bg: "bg-green-600 hover:bg-green-700" }
    : isRejecting
    ? { label: "Reject Request",  bg: "bg-red-600 hover:bg-red-700"   }
    : { label: "Save Changes",    bg: "bg-slate-700 hover:bg-slate-800" };

  // Only allow statuses that are user-selectable (Pending, Approved, Rejected)
  const selectableStatuses = ["pending", "approved", "rejected"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col">

        {/* ── Header ── */}
        <div className="bg-slate-800 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400 font-mono mb-1 block tracking-widest">
              {request.control_number
                ? `CTRL · ${request.control_number}`
                : "Control No. Pending Assignment"}
            </span>
            <h2 className="text-base font-bold text-white">{request.service_title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={request.status} />
              <ServiceTypeBadge serviceType={request.service_type} />
              <span className="text-xs text-slate-400">
                Filed {new Date(request.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors shrink-0 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Status Timeline ── */}
        <StatusTimeline currentStatus={request.status} />

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Applicant Details */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />Applicant Information
              </p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {fields.map((field) => {
                const val = request[field];
                if (!val && val !== 0) return null;
                return (
                  <div key={field}>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">
                      {FIELD_LABELS[field] || field}
                    </p>
                    <p className="text-sm text-slate-800 font-medium">{val}</p>
                  </div>
                );
              })}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date Filed</p>
                <p className="text-sm text-slate-800 font-medium">
                  {new Date(request.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              {request.processed_at && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Last Updated</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {new Date(request.processed_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {request.processed_by && <span className="text-slate-500"> by {request.processed_by}</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Verification Panel */}
          <VerificationPanel request={request} />

          {/* Processing Panel */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" />Process Request
              </p>
            </div>
            <div className="p-4 space-y-4">

              {/* Status Selector — only Pending, Approved, Rejected */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Update Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectableStatuses.map((val) => {
                    const cfg = STATUS_CONFIG[val];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={val}
                        onClick={() => setStatus(val)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                          status === val
                            ? val === "approved" ? "border-green-600 bg-green-600 text-white"
                            : val === "rejected" ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-600 bg-slate-700 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Approval confirmation notice */}
              {isApproving && statusChanged && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-green-800 mb-1">Ready to Approve</p>
                      <p className="text-xs text-green-700">
                        This request will be marked as <strong>Approved</strong>.
                        {!request.control_number && " A unique control number will be automatically assigned."}
                        {" "}The applicant will be notified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection warning + reason */}
              {isRejecting && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-800">
                      This action will reject the applicant's request. Please state a clear reason.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-red-700 uppercase tracking-widest mb-1.5">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Incomplete documents, invalid address, duplicate request..."
                      rows={2}
                      className="w-full px-3 py-2 border border-red-300 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Processed By */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Processed By
                </label>
                <input
                  type="text"
                  value={processedBy}
                  onChange={(e) => setProcessedBy(e.target.value)}
                  placeholder="Enter officer name..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  {isRejecting ? "Additional Remarks (Optional)" : "Admin Notes / Remarks"}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isRejecting ? "Any additional remarks for the applicant..." : "Add notes for the applicant..."}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
              </div>

              {/* Control Number Display */}
              {request.control_number && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Assigned Control Number
                  </p>
                  <p className="text-base font-bold text-green-700 font-mono tracking-widest">
                    {request.control_number}
                  </p>
                </div>
              )}

              {/* Previous admin notes (if already processed) */}
              {request.admin_notes && request.admin_notes !== adminNotes && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5">
                  <p className="text-xs text-blue-700 font-bold uppercase tracking-widest mb-1">Previous Note</p>
                  <p className="text-xs text-blue-800">{request.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          {/* Re-download button — only for already-approved requests */}
          {request.status === "approved" && hasDocxTemplate(request.service_type) && (
            <button
              onClick={handleGenerateDocx}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {generating
                ? <><Loader className="w-4 h-4 animate-spin" />Generating...</>
                : <><Download className="w-4 h-4" />Download DOCX</>}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${saveBtn.bg}`}
          >
            {saving
              ? <><Loader className="w-4 h-4 animate-spin" />Saving...</>
              : <><CheckCircle className="w-4 h-4" />{saveBtn.label}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Services() {
  const [requests,       setRequests]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [selectedReq,    setSelectedReq]    = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [fetchError,     setFetchError]     = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("fetchRequests error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-service-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, (payload) => {
        if (payload.eventType === "INSERT") {
          fetchRequests();
        } else if (payload.eventType === "UPDATE") {
          setRequests((prev) => prev.map((r) => r.id === payload.new.id ? { ...r, ...payload.new } : r));
          setSelectedReq((prev) => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        } else if (payload.eventType === "DELETE") {
          setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchRequests]);

  const handleSave = async (requestId, updates) => {
    setSaving(true);
    try {
      const original = requests.find((r) => r.id === requestId);
      const { error } = await supabase.from("service_requests").update(updates).eq("id", requestId);
      if (error) throw error;

      try {
        await logAuditAction({
          action:      "update",
          actionType:  "service_request",
          description: `Updated service request (${original?.service_title}) status to "${updates.status}"${updates.control_number ? `. Control No: ${updates.control_number}` : ""}.`,
          severity:    updates.status === "rejected" ? "warning" : "info",
          targetId:    requestId,
          targetType:  "service_request",
          targetName:  original?.service_title,
          oldValues:   { status: original?.status },
          newValues:   { status: updates.status, control_number: updates.control_number },
        });
      } catch (auditErr) {
        console.error("Audit log failed:", auditErr);
      }

      // Auto-generate DOCX when approving
      if (
        updates.status === "approved" &&
        original?.status !== "approved" &&
        hasDocxTemplate(original?.service_type)
      ) {
        try {
          const images = await loadHeaderImages();
          await generateCertificate({ ...original, ...updates }, images);
        } catch (docErr) {
          console.warn("Auto DOCX generation failed (retry from table):", docErr.message);
        }
      }

      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      console.error("handleSave error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered list ──
  const filtered = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.service_title?.toLowerCase().includes(q) ||
      r.control_number?.toLowerCase().includes(q) ||
      r.contact_number?.includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType   = typeFilter   === "all" || r.service_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total:      requests.length,
    pending:    requests.filter((r) => r.status === "pending").length,
    approved:   requests.filter((r) => r.status === "approved").length,
    rejected:   requests.filter((r) => r.status === "rejected").length,
  };

  // For the status tabs, we only show Pending, Approved, Rejected, and All.
  const statusTabs = [
    { key: "all",      label: "All",      count: stats.total },
    { key: "pending",  label: "Pending",  count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 uppercase tracking-widest font-semibold">
            <FileText className="w-3.5 h-3.5" />Document Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Barangay Services</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review, process, and approve citizen document requests</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Fetch error banner ── */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">Failed to load requests: {fetchError}</p>
          <button onClick={fetchRequests} className="ml-auto text-xs font-semibold text-red-700 underline">Retry</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: stats.total,      color: "text-slate-700", border: "border-l-slate-400" },
          { label: "Pending",    value: stats.pending,    color: "text-slate-600", border: "border-l-slate-400" },
          { label: "Approved",   value: stats.approved,   color: "text-green-600", border: "border-l-green-500" },
          { label: "Rejected",   value: stats.rejected,   color: "text-red-600",   border: "border-l-red-500"   },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`bg-white border border-slate-200 border-l-4 ${border} rounded-lg p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, control number, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG)
              .filter(([key]) => key !== "processing") // exclude processing from dropdown
              .map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowTypeFilter((p) => !p)}
              className="flex items-center gap-2 px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                {typeFilter === "all" ? "All Types" : SERVICE_TYPES.find((s) => s.id === typeFilter)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showTypeFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 w-60 py-1">
                <button
                  onClick={() => { setTypeFilter("all"); setShowTypeFilter(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${typeFilter === "all" ? "font-bold text-slate-800" : "text-slate-600"}`}
                >
                  All Types
                </button>
                {SERVICE_TYPES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setTypeFilter(s.id); setShowTypeFilter(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${typeFilter === s.id ? "font-bold text-slate-800" : "text-slate-600"}`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />{s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setTypeFilter("all"); }}
              className="px-3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Showing <strong className="text-slate-600">{filtered.length}</strong>{" "}
          of <strong className="text-slate-600">{requests.length}</strong> requests
        </p>
      </div>

      {/* ── Status Tab Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusTabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors capitalize border ${
              statusFilter === key
                ? "bg-slate-700 text-white border-slate-700"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-7 h-7 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-500 font-medium">Loading requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No requests found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Date Filed","Applicant","Service Type","Details","Status","Control No.","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-slate-800 font-medium">
                        {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(req.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    {/* Applicant */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{req.full_name}</p>
                      <p className="text-xs text-slate-400">{req.contact_number}</p>
                    </td>

                    {/* Service Type */}
                    <td className="px-4 py-3">
                      <ServiceTypeBadge serviceType={req.service_type} />
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {req.purpose && (
                        <p className="text-xs text-slate-600 truncate" title={req.purpose}>📋 {req.purpose}</p>
                      )}
                      {req.business_name && (
                        <p className="text-xs text-slate-600 truncate">🏪 {req.business_name}</p>
                      )}
                      {req.assistance_type && (
                        <p className="text-xs text-slate-600 truncate">💊 {req.assistance_type}</p>
                      )}
                      {/* Legacy records may still have items_to_roast */}
                      {req.items_to_roast && (
                        <p className="text-xs text-slate-600 truncate">📋 {req.items_to_roast}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                      {req.processed_by && (
                        <p className="text-xs text-slate-400 mt-1">by {req.processed_by}</p>
                      )}
                    </td>

                    {/* Control Number */}
                    <td className="px-4 py-3">
                      {req.control_number ? (
                        <span className="text-xs font-bold text-green-700 font-mono bg-green-50 border border-green-200 px-2 py-1 rounded">
                          {req.control_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />Process
                        </button>
                        {req.status === "pending" && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Awaiting action" />
                        )}
                        {req.status === "approved" && hasDocxTemplate(req.service_type) && (
                          <QuickDownloadButton request={req} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReq && (
        <RequestModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}