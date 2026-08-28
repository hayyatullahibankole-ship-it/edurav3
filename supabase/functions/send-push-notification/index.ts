import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId?: string; // auth user id
  userIds?: string[]; // multiple auth user ids
  title: string;
  body: string;
  route?: string;
  data?: Record<string, string>;
}

// ---- FCM HTTP v1 auth (service account -> OAuth access token) ----
const pemToArrayBuffer = (pem: string) => {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

const b64url = (input: string | Uint8Array) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const getAccessToken = async (sa: { client_email: string; private_key: string }) => {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`)),
  );
  const jwt = `${header}.${claim}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google OAuth failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jsonRes = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const payload = (await req.json()) as NotificationPayload;
    const { title, body, route, data } = payload;
    const authUserIds = payload.userIds?.length ? payload.userIds : payload.userId ? [payload.userId] : [];

    if (!title || !body || authUserIds.length === 0) {
      return jsonRes({ error: "Missing required fields: title, body and userId(s)" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .in("auth_user_id", authUserIds);
    if (usersError) throw usersError;
    const appUserIds = (users ?? []).map((u: { id: string }) => u.id);
    if (appUserIds.length === 0) return jsonRes({ success: false, message: "No matching users" });

    const { data: devices, error: devicesError } = await supabase
      .from("push_devices")
      .select("id, user_id, token")
      .in("user_id", appUserIds)
      .eq("enabled", true);
    if (devicesError) throw devicesError;

    // Always store an in-app notification, even when no device is registered.
    await supabase.from("notifications").insert(
      appUserIds.map((id) => ({
        user_id: id,
        title,
        message: body,
        type: "push",
        metadata: { ...(data ?? {}), ...(route ? { route } : {}) },
      })),
    );

    if (!devices?.length) {
      return jsonRes({ success: true, sent: 0, message: "Saved in-app; no registered devices" });
    }

    const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!raw) {
      return jsonRes({ success: true, sent: 0, message: "FIREBASE_SERVICE_ACCOUNT_JSON not configured" });
    }
    const sa = JSON.parse(raw) as { client_email: string; private_key: string; project_id: string };
    const accessToken = await getAccessToken(sa);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    const staleDeviceIds: string[] = [];

    for (const device of devices) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title, body },
            // FCM requires every data value to be a string.
            data: Object.fromEntries(
              Object.entries({ ...(data ?? {}), ...(route ? { route } : {}) }).map(
                ([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)],
              ),
            ),
            android: {
              priority: "HIGH",
              notification: {
                sound: "default",
                channel_id: "edura_default",
                default_vibrate_timings: true,
                notification_priority: "PRIORITY_HIGH",
                click_action: "FCM_PLUGIN_ACTIVITY",
              },
            },
            apns: { payload: { aps: { sound: "default", badge: 1 } } },
          },
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        console.error("FCM send failed", device.id, res.status, err);
        if (res.status === 404 || res.status === 400) staleDeviceIds.push(device.id);
      }
    }

    if (staleDeviceIds.length) {
      await supabase.from("push_devices").update({ enabled: false }).in("id", staleDeviceIds);
    }

    return jsonRes({ success: true, sent, devices: devices.length, disabled: staleDeviceIds.length });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return jsonRes({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
