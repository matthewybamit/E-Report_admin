// src/utils/barangayJurisdiction.js
// ─────────────────────────────────────────────────────────────────────────────
// Uses Groq AI to determine whether a report/emergency location is within
// Barangay Salvacion and — if not — identify the most likely barangay.
// ─────────────────────────────────────────────────────────────────────────────
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Ask the AI to determine barangay jurisdiction.
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
 * }>}
 */
export async function analyzeJurisdiction({ lat, lng, locationText = '' }) {
  if (!lat || !lng) return null;

  const prompt = `You are a Philippine local government geographic expert with detailed knowledge of all barangays across the Philippines.

A report or emergency has been filed with the following location data:
- Latitude: ${lat}
- Longitude: ${lng}
- Location description: "${locationText || 'Not provided'}"

The barangay operating this system is: Barangay Salvacion, Butuan City, Agusan del Norte, Philippines.
Barangay Salvacion is located in the northeastern part of Butuan City near coordinates approximately 8.962°N, 125.548°E.

Your task:
1. Determine whether these GPS coordinates fall within Barangay Salvacion, Butuan City.
2. If outside, identify the most likely barangay, city/municipality, and province based on the coordinates.
3. Suggest which barangay office should handle this incident.

Respond ONLY in this exact JSON format with no other text:
{
  "isOutside": true,
  "confidence": "high",
  "detectedBarangay": "Barangay Name Here",
  "detectedCity": "City or Municipality Name",
  "detectedProvince": "Province Name",
  "reasoning": "One concise sentence explaining the geographic determination.",
  "contactSuggestion": "Contact the Barangay Captain or BPSO of [Barangay Name], [City]."
}

Rules:
- Set "isOutside" to false ONLY if coordinates are within Barangay Salvacion itself.
- Set "confidence" to "high" if you are certain, "medium" if reasonably sure, "low" if approximate.
- If inside Salvacion, set detectedBarangay, detectedCity, detectedProvince, contactSuggestion all to null.
- Use proper Philippine address conventions and real barangay names.
- Apply your full geographic knowledge of Butuan City, Caraga Region, and all Philippine provinces.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 300,
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
      : '⚠️  Location is outside Barangay Salvacion boundaries',
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
    jurisdictionResult?.contactSuggestion ? `💡 Suggested:   ${jurisdictionResult.contactSuggestion}` : '',
    `⏰ Filed:       ${new Date(report.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`,
    '',
    '— Forwarded from Barangay Salvacion Emergency Response System',
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
      : '⚠️  Location is outside Barangay Salvacion boundaries',
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
    jurisdictionResult?.contactSuggestion ? `💡 Suggested:    ${jurisdictionResult.contactSuggestion}` : '',
    `⏰ Reported:     ${new Date(emergency.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`,
    '',
    '— Forwarded from Barangay Salvacion Emergency Response System',
  ];
  return lines.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}