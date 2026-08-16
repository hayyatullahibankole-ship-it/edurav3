import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const TOTAL_DAYS = 5;

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

function currentDay(redeemedAt: string | null): number {
  if (!redeemedAt) return 1;
  const start = new Date(redeemedAt);
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Math.floor((today - startDay) / 86400000);
  return Math.min(Math.max(diff + 1, 1), TOTAL_DAYS);
}

async function loadState(testerId: string) {
  const [{ data: tester }, { data: reports }, { data: settings }] = await Promise.all([
    admin.from("beta_testers").select("*").eq("id", testerId).maybeSingle(),
    admin.from("beta_reports").select("*").eq("tester_id", testerId).order("day_number"),
    admin.from("beta_settings").select("day_number, focus_note").order("day_number"),
  ]);
  if (!tester) return null;
  return {
    tester: {
      id: tester.id,
      code: tester.code,
      name: tester.name,
      email: tester.email,
      phone: tester.phone,
      status: tester.status,
      redeemed_at: tester.redeemed_at,
    },
    reports: reports ?? [],
    focusNotes: settings ?? [],
    currentDay: currentDay(tester.redeemed_at),
    totalDays: TOTAL_DAYS,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = str(body.action, 40);
    const device = str(body.device, 200);

    if (action === "redeem") {
      const code = str(body.code, 40).toUpperCase();
      const name = str(body.name, 100);
      const email = str(body.email, 255);
      const phone = str(body.phone, 30);

      if (!code) return json({ error: "Enter your invite code." }, 400);
      if (!name || name.length < 2) return json({ error: "Enter your full name." }, 400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Enter a valid email." }, 400);
      if (!device) return json({ error: "Unable to identify this device." }, 400);

      const { data: tester } = await admin
        .from("beta_testers")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!tester) return json({ error: "Invalid invite code." }, 404);
      if (tester.status === "revoked") return json({ error: "This invite code has been revoked." }, 403);

      if (tester.device_fingerprint && tester.device_fingerprint !== device) {
        return json({ error: "This code is already in use on another device." }, 403);
      }

      const { data: updated, error } = await admin
        .from("beta_testers")
        .update({
          name,
          email,
          phone: phone || tester.phone,
          device_fingerprint: device,
          status: "active",
          redeemed_at: tester.redeemed_at ?? new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .eq("id", tester.id)
        .select("id")
        .single();

      if (error) return json({ error: "Could not activate your code." }, 500);
      return json(await loadState(updated.id));
    }

    if (action === "state" || action === "submit") {
      const code = str(body.code, 40).toUpperCase();
      if (!code || !device) return json({ error: "Missing session." }, 400);

      const { data: tester } = await admin
        .from("beta_testers")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!tester) return json({ error: "Invalid invite code." }, 404);
      if (tester.status === "revoked") return json({ error: "This invite code has been revoked." }, 403);
      if (tester.device_fingerprint && tester.device_fingerprint !== device) {
        return json({ error: "This code is locked to another device." }, 403);
      }

      if (action === "state") {
        await admin
          .from("beta_testers")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", tester.id);
        return json(await loadState(tester.id));
      }

      const requestedDay = Number(body.day_number);
      const day = Number.isFinite(requestedDay) && requestedDay >= 1
        ? Math.min(Math.max(Math.floor(requestedDay), 1), TOTAL_DAYS)
        : currentDay(tester.redeemed_at);
      const rating = Math.min(Math.max(Number(body.rating) || 0, 1), 5);
      const payload = {
        tester_id: tester.id,
        day_number: day,
        rating,
        what_worked: str(body.what_worked, 4000),
        issues: str(body.issues, 4000),
        suggestions: str(body.suggestions, 4000),
        device_info: str(body.device_info, 200),
        screenshots: Array.isArray(body.screenshots)
          ? body.screenshots.filter((s: unknown) => typeof s === "string").slice(0, 3)
          : [],
      };

      const { error } = await admin
        .from("beta_reports")
        .upsert(payload, { onConflict: "tester_id,day_number" });

      if (error) {
        console.error("submit error", error);
        return json({ error: "Could not save your report." }, 500);
      }

      await admin
        .from("beta_testers")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", tester.id);

      return json(await loadState(tester.id));
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    console.error("beta-portal error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
