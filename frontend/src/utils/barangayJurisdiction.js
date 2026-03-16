// src/utils/barangayJurisdiction.js
// ─────────────────────────────────────────────────────────────────────────────
// Uses Groq AI to determine whether a report/emergency location is within
// Barangay Salvacion, La Loma, Quezon City and — if outside — identify the
// most likely barangay.
//
// KEY FACTS the AI is given:
//   Barangay Salvacion, La Loma, 1st District, Quezon City, Metro Manila 1114
//   Center:     14.6268°N, 120.9942°E  (PhilAtlas official census data)
//   Address ref: 74 Bulusan St., Brgy. Salvacion, La Loma, Quezon City 1114
//   Neighboring barangays: Brgy. Manresa, Brgy. Sta. Cruz, Brgy. Paraiso,
//                           Brgy. La Loma, Brgy. Salvacion (distinct from
//                           other "Salvacion" barangays elsewhere in PH)
//
// RADIUS TOLERANCE:
//   GPS from mobile devices can drift ±50–200m in dense urban areas.
//   Any point within TOLERANCE_METERS of Salvacion's center is treated as
//   "within jurisdiction" even if technically just outside the boundary.
//   The AI is also instructed to apply this tolerance in its reasoning.
// ─────────────────────────────────────────────────────────────────────────────
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Barangay Salvacion center (PhilAtlas)
const SALVACION_CENTER_LAT = 14.6268;
const SALVACION_CENTER_LNG = 120.9942;

// GPS tolerance radius — points within this distance are considered inside
// even if coordinates put them just outside the polygon boundary.
// 300m covers typical urban GPS drift + small barangay (~400m across).
const TOLERANCE_METERS = 300;

/**
 * Haversine distance in metres between two lat/lng points.
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Quick pre-check: is the point close enough to Salvacion that we can
 * skip the AI call and immediately return "inside"?
 * Returns true if within TOLERANCE_METERS of the barangay center.
 */
function isWithinTolerance(lat, lng) {
  const dist = haversineMeters(lat, lng, SALVACION_CENTER_LAT, SALVACION_CENTER_LNG);
  return dist <= TOLERANCE_METERS;
}

/**
 * Ask Groq AI to determine barangay jurisdiction.
 *
 * @param {{ lat: number, lng: number, locationText?: string }} params
 * @returns {Promise<{
 *   isOutside:         boolean,
 *   confidence:        'high'|'medium'|'low',
 *   detectedBarangay:  string|null,
 *   detectedCity:      string|null,
 *   detectedProvince:  string|null,
 *   reasoning:         string,
 *   contactSuggestion: string|null,
 *   withinTolerance:   boolean,   // true if inside via radius fallback
 * }>}
 */
export async function analyzeJurisdiction({ lat, lng, locationText = '' }) {
  if (!lat || !lng) return null;

  // ── Fast path: within tolerance radius → definitely inside ──────────────
  if (isWithinTolerance(lat, lng)) {
    const dist = Math.round(haversineMeters(lat, lng, SALVACION_CENTER_LAT, SALVACION_CENTER_LNG));
    return {
      isOutside:        false,
      confidence:       'high',
      detectedBarangay: null,
      detectedCity:     null,
      detectedProvince: null,
      reasoning:        `Coordinates are ${dist}m from Barangay Salvacion's center — within the ${TOLERANCE_METERS}m jurisdiction radius.`,
      contactSuggestion:null,
      withinTolerance:  true,
    };
  }

  // ── AI analysis for points outside the tolerance radius ──────────────────
  const distFromCenter = Math.round(
    haversineMeters(lat, lng, SALVACION_CENTER_LAT, SALVACION_CENTER_LNG)
  );

  const prompt = `You are a Philippine local government geographic expert with precise knowledge of all barangays in Metro Manila and Quezon City.

A report or emergency has been filed with the following location data:
- Latitude:  ${lat}
- Longitude: ${lng}
- Distance from Barangay Salvacion center: ${distFromCenter} metres
- Location description: "${locationText || 'Not provided'}"

The barangay operating this system is:
  Barangay Salvacion, La Loma, 1st District, Quezon City, Metro Manila 1114
  Center coordinates: 14.6268°N, 120.9942°E
  Reference address: 74 Bulusan Street, Brgy. Salvacion, La Loma, Quezon City 1114
  Neighboring barangays: Brgy. Manresa, Brgy. Sta. Cruz, Brgy. Paraiso, Brgy. La Loma (all in Quezon City)

IMPORTANT NOTES:
- This is the Quezon City "Salvacion" in La Loma — NOT the Butuan City or any other Salvacion.
- The barangay is small (approximately 400m across) in a dense urban area of Quezon City.
- GPS coordinates from mobile phones in dense urban areas can drift 50–200m due to signal reflection.
- A TOLERANCE RADIUS of ${TOLERANCE_METERS}m applies: if the coordinates are within ${TOLERANCE_METERS}m of the center (14.6268, 120.9942), treat it as INSIDE jurisdiction even if technically just outside the boundary. The distance from center is ${distFromCenter}m, which is OUTSIDE the tolerance radius.
- Only mark "isOutside: true" if you are confident the location is genuinely in a different barangay.

Your task:
1. Determine if ${lat}, ${lng} falls within or very close to Barangay Salvacion, La Loma, Quezon City.
2. If outside (and not near-boundary drift), identify the correct barangay.
3. Suggest which barangay office should handle this.

Respond ONLY in this exact JSON format with no other text:
{
  "isOutside": false,
  "confidence": "high",
  "detectedBarangay": null,
  "detectedCity": null,
  "detectedProvince": null,
  "reasoning": "One concise sentence explaining the geographic determination.",
  "contactSuggestion": null
}

Rules:
- "isOutside": false if the coordinates are within or very close to Brgy. Salvacion, La Loma QC.
- "isOutside": true only if clearly a different barangay.
- If isOutside is false, all detected* fields and contactSuggestion must be null.
- Use exact Quezon City barangay names (e.g. "Barangay Manresa", "Barangay Sta. Cruz").
- "confidence": "high" if certain, "medium" if near a boundary, "low" if unsure.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model:       'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens:  300,
    });

    const text  = completion.choices[0]?.message?.content || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    return {
      isOutside:         !!parsed.isOutside,
      confidence:        parsed.confidence        || 'medium',
      detectedBarangay:  parsed.detectedBarangay  || null,
      detectedCity:      parsed.detectedCity      || null,
      detectedProvince:  parsed.detectedProvince  || null,
      reasoning:         parsed.reasoning         || '',
      contactSuggestion: parsed.contactSuggestion || null,
      withinTolerance:   false,
    };
  } catch (err) {
    console.error('analyzeJurisdiction error:', err);
    return null;
  }
}

// ── Share text builders ───────────────────────────────────────────────────────

export function buildReportShareText(report, jurisdictionResult) {
  const brgy = jurisdictionResult?.detectedBarangay;
  const city = jurisdictionResult?.detectedCity;
  const lines = [
    '📋 INCIDENT REPORT — OUTSIDE SALVACION JURISDICTION',
    brgy
      ? `⚠️  Location identified as: ${brgy}${city ? ', ' + city : ''}`
      : '⚠️  Location is outside Barangay Salvacion, La Loma, Quezon City',
    '',
    `📌 Report #:    ${report.report_number || 'N/A'}`,
    `📂 Category:    ${(report.category || '').toUpperCase()}`,
    `🏷️  Title:       ${report.title || 'N/A'}`,
    `📝 Description: ${report.description || 'N/A'}`,
    '',
    `📍 Address:     ${report.location || 'Not provided'}`,
    (report.latitude && report.longitude)
      ? `🗺️  GPS:         ${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`
      : '',
    (report.latitude && report.longitude)
      ? `🔗 Maps:        https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
      : '',
    '',
    `👤 Reporter:    ${report.reporter_name || 'Anonymous'}`,
    report.reporter_phone ? `📞 Phone:       ${report.reporter_phone}` : '',
    '',
    jurisdictionResult?.contactSuggestion
      ? `💡 Suggested:   ${jurisdictionResult.contactSuggestion}`
      : '',
    `⏰ Filed:       ${new Date(report.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`,
    '',
    '— Forwarded from Barangay Salvacion Emergency Response System',
    '   74 Bulusan St., Brgy. Salvacion, La Loma, Quezon City 1114',
  ];
  return lines.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function buildEmergencyShareText(emergency, jurisdictionResult) {
  const brgy = jurisdictionResult?.detectedBarangay;
  const city = jurisdictionResult?.detectedCity;
  const lines = [
    '🚨 EMERGENCY ALERT — OUTSIDE SALVACION JURISDICTION',
    brgy
      ? `⚠️  Location identified as: ${brgy}${city ? ', ' + city : ''}`
      : '⚠️  Location is outside Barangay Salvacion, La Loma, Quezon City',
    '',
    `🆘 Type:         ${emergency.type || 'Unknown'} Emergency`,
    `⚡ Severity:     ${(emergency.severity || 'High').toUpperCase()}`,
    `📝 Description:  ${emergency.description || 'N/A'}`,
    '',
    `📍 Address:      ${emergency.location_text || 'GPS only'}`,
    (emergency.latitude && emergency.longitude)
      ? `🗺️  GPS:          ${Number(emergency.latitude).toFixed(6)}, ${Number(emergency.longitude).toFixed(6)}`
      : '',
    (emergency.latitude && emergency.longitude)
      ? `🔗 Maps:         https://www.google.com/maps/search/?api=1&query=${emergency.latitude},${emergency.longitude}`
      : '',
    '',
    jurisdictionResult?.contactSuggestion
      ? `💡 Suggested:    ${jurisdictionResult.contactSuggestion}`
      : '',
    `⏰ Reported:     ${new Date(emergency.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`,
    '',
    '— Forwarded from Barangay Salvacion Emergency Response System',
    '   74 Bulusan St., Brgy. Salvacion, La Loma, Quezon City 1114',
  ];
  return lines.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}