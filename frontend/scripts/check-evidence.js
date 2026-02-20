// frontend/scripts/check-evidence.js
// Run with: npm run ai:check-evidence

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL     = process.env.APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY         = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.APP_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY env vars');
  console.error('SUPABASE_URL =', SUPABASE_URL);
  console.error('ANON_KEY present =', !!ANON_KEY);
  console.error('SERVICE_ROLE_KEY present =', !!SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function callEvidenceFunction(report) {
  const url = `${SUPABASE_URL}/functions/v1/check-report-evidence`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ report }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge Function error (${res.status}): ${text}`);
  }

  return res.json();
}

async function main() {
  console.log('🔍 Finding resolved reports with evidence...');

  // ✅ UPDATED: added image_url + media_urls so the edge function
  //    can resolve the correct image from user-submitted reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      'id, report_number, category, title, description, location, ' +
      'responder_notes, evidence_photo_url, video_url, image_url, media_urls'
    )
    .eq('status', 'resolved')
    .not('evidence_photo_url', 'is', null);

  if (error) {
    console.error('Error fetching reports:', error);
    process.exit(1);
  }

  if (!reports || reports.length === 0) {
    console.log('No resolved reports with evidence found.');
    process.exit(0);
  }

  console.log(`Found ${reports.length} report(s). Running AI check...`);

  for (const report of reports) {
    try {
      console.log(`\n🧠 Checking report ${report.report_number} (${report.id})...`);

      const result = await callEvidenceFunction(report);
      const { verdict, score, explanation } = result;

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          ai_verdict: verdict,
          ai_score:   score,
          ai_notes:   explanation,
        })
        .eq('id', report.id);

      if (updateError) {
        console.error('Error updating report:', updateError);
      } else {
        console.log(`✅ Updated AI fields: verdict=${verdict}, score=${score}`);
      }
    } catch (err) {
      console.error('❌ Error processing report:', err.message);
    }
  }

  console.log('\n✅ Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
