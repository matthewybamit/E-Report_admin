// supabase/functions/check-report-evidence/index.ts
import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

const GROQ_API_KEY     = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ✅ Detect if a URL points to a video file (Groq vision doesn't support video)
function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv|m4v|ogv)(\?|$)/i.test(url) ||
    url.includes('/report-videos/');
}

// ✅ Detect if a URL points to a supported image
function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|tiff?)(\?|$)/i.test(url) ||
    url.includes('/report-images/');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { report } = await req.json();

    if (!report || !report.id) {
      return new Response(
        JSON.stringify({ error: "Missing report data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          verdict: "uncertain",
          score: 0.5,
          explanation: "GROQ_API_KEY is not set on this project.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Resolve best image URL — skip video URLs for vision model
    //    Priority: media_urls[0] → image_url → evidence_photo_url
    //    Video URLs are noted but NOT passed to the vision model
    let imageUrl: string | null = null;
    let hasVideoOnly = false;

    if (Array.isArray(report.media_urls) && report.media_urls.length > 0) {
      // Find the first image in media_urls (skip videos)
      const firstImage = report.media_urls.find((u: string) => isImageUrl(u) && !isVideoUrl(u));
      if (firstImage) {
        imageUrl = firstImage;
      } else if (report.media_urls.some((u: string) => isVideoUrl(u))) {
        hasVideoOnly = true; // has media but only videos
      }
    }

    if (!imageUrl && report.image_url && !isVideoUrl(report.image_url)) {
      imageUrl = report.image_url;
    }

    if (!imageUrl && report.evidence_photo_url && !isVideoUrl(report.evidence_photo_url)) {
      imageUrl = report.evidence_photo_url;
    }

    // Check if there's a video (for context in the prompt)
    const hasVideo = hasVideoOnly ||
      !!report.video_url ||
      (Array.isArray(report.media_urls) && report.media_urls.some((u: string) => isVideoUrl(u)));

    console.log("Report ID:", report.id, "| imageUrl:", imageUrl, "| hasVideo:", hasVideo);

    const mediaContext = imageUrl
      ? "Look at the attached image and judge:"
      : hasVideo
      ? "A video was submitted but cannot be analyzed visually. Assess based on report text:"
      : "No media was provided. Assess based on the report text alone:";

    const textPrompt = `You are helping a city admin detect false, fabricated, or spam reports submitted by citizens.

Report details:
- Category: ${report.category}
- Title: ${report.title}
- Description: ${report.description}
- Location: ${report.location ?? "N/A"}
- Responder notes: ${report.responder_notes ?? "N/A"}
- Media submitted: ${imageUrl ? "Yes (image)" : hasVideo ? "Yes (video only — not analyzable)" : "None"}

${mediaContext}
1. Does the photo/scene match the reported category and description?
   (e.g. a pothole report should show a road or pavement, not a house interior)
2. Does it look like genuine on-site evidence, or a stock/unrelated photo?
3. Are there obvious mismatches between the image and the reported incident?

Be CONSERVATIVE — only mark "suspicious" when the mismatch is clearly obvious.
Use "uncertain" when you genuinely cannot tell.

Return ONLY valid JSON, no markdown, no extra text:
{
  "verdict": "likely_real",
  "score": 0.1,
  "explanation": "The image shows a cracked road surface consistent with the pothole report."
}`;

    let model: string;
    let messages: unknown[];

    if (imageUrl) {
      // ✅ Vision model — only when we have a real image URL
      model = "meta-llama/llama-4-maverick-17b-128e-instruct";
      messages = [
        {
          role: "user",
          content: [
            { type: "text",      text: textPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ];
    } else {
      // ✅ Text-only fallback (video-only reports or no media)
      model = "llama-3.3-70b-versatile";
      messages = [
        {
          role: "system",
          content: "You review citizen incident reports and provide a cautious fraud risk assessment.",
        },
        { role: "user", content: textPrompt },
      ];
    }

    console.log("Using model:", model);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: 300 }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return new Response(
        JSON.stringify({
          verdict: "uncertain",
          score: 0.5,
          explanation: `Groq API error ${groqRes.status}: ${errText.slice(0, 200)}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqBody    = await groqRes.json();
    const rawContent: string = groqBody.choices?.[0]?.message?.content ?? "";
    console.log("Raw Groq output:", rawContent);

    let parsed: { verdict: string; score: number; explanation: string };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*?\}/);
      const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!candidate?.verdict) throw new Error("Missing verdict");
      parsed = candidate;
    } catch {
      parsed = {
        verdict: "uncertain",
        score: 0.5,
        explanation: `Parse failed. Raw: ${rawContent.slice(0, 250)}`,
      };
    }

    // Write results back to DB
    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?id=eq.${report.id}`,
        {
          method: "PATCH",
          headers: {
            "apikey":        SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal",
          },
          body: JSON.stringify({
            ai_verdict: parsed.verdict,
            ai_score:   parsed.score,
            ai_notes:   parsed.explanation,
          }),
        }
      );
      if (!updateRes.ok) {
        console.error("Supabase update error:", await updateRes.text());
      } else {
        console.log("DB update OK");
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Outer error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
