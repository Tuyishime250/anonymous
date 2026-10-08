import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const categories = new Set(["School", "Family", "Relationships", "Money", "Work", "Health", "Other"]);

function moderationFlags(content: string): string[] {
  const flags: string[] = [];
  if (/\b(i will|i'm going to|we will|going to)\s+(kill|hurt|attack|beat|shoot)\b/i.test(content)) flags.push("possible_threat");
  if (/\b(kill yourself|you should die|go die|i hate you|you are worthless|stupid idiot)\b/i.test(content)) flags.push("possible_abuse");
  return flags;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (typeof payload.website === "string" && payload.website.trim()) return json({ error: "Submission rejected" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration error" }, 500);
  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (payload.kind === "report") {
    if (typeof payload.message_id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.message_id)) return json({ error: "Invalid message" }, 400);
    const reason = typeof payload.reason === "string" ? payload.reason.trim().slice(0, 500) : "";
    const { error } = await db.rpc("submit_report", { target_message_id: payload.message_id, report_reason: reason });
    if (error) { console.error("Report insert failed", error); return json({ error: "Could not submit report" }, 500); }
    return json({ ok: true });
  }

  if (payload.kind !== "message" && payload.kind !== "reply") return json({ error: "Invalid submission type" }, 400);
  if (typeof payload.content !== "string") return json({ error: "Message is required" }, 400);
  const content = payload.content.trim();
  const minimum = 10;
  const maximum = payload.kind === "reply" ? 2000 : 5000;
  if (content.length < minimum || content.length > maximum) return json({ error: "Message length is invalid" }, 400);
  if (payload.kind === "message") {
    const category = payload.category === null || payload.category === "" ? null : payload.category;
    if (category !== null && (typeof category !== "string" || !categories.has(category))) return json({ error: "Invalid category" }, 400);
    const { error } = await db.from("messages").insert({
      content, category, status: "pending", moderation_flags: moderationFlags(content),
    });
    if (error) { console.error("Message insert failed", error); return json({ error: "Could not save message" }, 500); }
    return json({ ok: true }, 201);
  }

  if (typeof payload.message_id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.message_id)) return json({ error: "Invalid message" }, 400);
  const { data: parent, error: parentError } = await db.from("messages").select("id").eq("id", payload.message_id).eq("status", "approved").maybeSingle();
  if (parentError) return json({ error: "Could not verify message" }, 500);
  if (!parent) return json({ error: "Message not found" }, 404);
  const { error } = await db.from("replies").insert({ message_id: parent.id, content, status: "pending" });
  if (error) { console.error("Reply insert failed", error); return json({ error: "Could not save reply" }, 500); }
  return json({ ok: true }, 201);
});
