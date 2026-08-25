import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_USERS = 4000; // bound work per run
const LOCK_KEY = "notification_engine_lock";
const LOCK_MINUTES = 10;

type RunWindow = "evening" | "morning";

interface Candidate {
  userId: string;
  authUserId: string | null;
  ruleKey: string;
  priority: number;
  title: string;
  body: string;
  route: string;
  dedupeKey: string;
  type?: string;
}

const daysBetween = (a: Date, b: Date) =>
  Math.floor((a.setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0)) / 86400000);

const todayKey = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const runWindow: RunWindow = body?.window === "morning" ? "morning" : "evening";
    const dryRun = body?.dryRun === true;

    // ---- master switch -------------------------------------------------
    const { data: settingsRows } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["notifications_enabled", LOCK_KEY]);
    const settings = Object.fromEntries((settingsRows || []).map((r: any) => [r.key, r.value]));

    if (settings["notifications_enabled"] === "false") {
      return json({ skipped: "notifications disabled" });
    }

    // ---- broadcast mode (news / announcements fan-out) -------------------
    if (body?.mode === "broadcast") {
      const title = String(body?.title || "").slice(0, 120);
      const message = String(body?.message || "").slice(0, 500);
      const route = String(body?.route || "/dashboard");
      const stage = body?.stage as string | undefined; // 'candidate' | 'campus' | undefined
      const ruleKey = String(body?.ruleKey || "news_published");
      const dedupeKey = String(body?.dedupeKey || crypto.randomUUID());

      if (!title || !message) return json({ error: "title and message are required" }, 400);

      const rule = await supabase
        .from("notification_rules")
        .select("enabled")
        .eq("rule_key", ruleKey)
        .maybeSingle();
      if (rule.data && rule.data.enabled === false) return json({ skipped: "rule disabled" });

      let q = supabase
        .from("users")
        .select("id, auth_user_id, academic_stage")
        .eq("is_suspended", false)
        .not("auth_user_id", "is", null)
        .limit(MAX_USERS);
      if (stage === "campus") q = q.in("academic_stage", ["undergraduate", "graduate"]);
      if (stage === "candidate") q = q.or("academic_stage.is.null,academic_stage.in.(secondary,sss3,candidate)");

      const { data: targets } = await q;
      const list = targets || [];
      const inserted: any[] = [];
      for (const t of list) {
        const { error } = await supabase.from("notification_log").insert({
          user_id: t.id, rule_key: ruleKey, dedupe_key: dedupeKey, channel: "inapp",
        });
        if (!error) inserted.push(t);
      }
      if (inserted.length) {
        await supabase.from("notifications").insert(
          inserted.map((t) => ({
            user_id: t.id, title, message, type: "info",
            metadata: { route, rule: ruleKey, automated: true },
          })),
        );
        const authIds = inserted.map((t) => t.auth_user_id).filter(Boolean);
        for (let i = 0; i < authIds.length; i += 200) {
          try {
            await supabase.functions.invoke("send-push-notification", {
              body: { userIds: authIds.slice(i, i + 200), title, body: message, route },
            });
          } catch (e) {
            console.error("broadcast push failed", e);
          }
        }
        await supabase.from("notification_rules")
          .update({ last_run_at: new Date().toISOString(), last_sent_count: inserted.length })
          .eq("rule_key", ruleKey);
      }
      return json({ mode: "broadcast", sent: inserted.length });
    }


    // ---- single-flight lock --------------------------------------------
    const now = new Date();
    const lockValue = settings[LOCK_KEY];
    if (lockValue) {
      const lockedAt = new Date(lockValue);
      if (!isNaN(lockedAt.getTime()) && now.getTime() - lockedAt.getTime() < LOCK_MINUTES * 60000) {
        return json({ skipped: "another run in progress" });
      }
    }
    if (!dryRun) {
      await supabase.from("system_settings").upsert(
        { key: LOCK_KEY, value: now.toISOString(), description: "Notification engine run lock" },
        { onConflict: "key" },
      );
    }

    // ---- rules ----------------------------------------------------------
    const { data: rules } = await supabase
      .from("notification_rules")
      .select("rule_key, enabled, priority, run_window");
    const ruleMap = new Map<string, any>((rules || []).map((r: any) => [r.rule_key, r]));
    const ruleActive = (key: string) => {
      const r = ruleMap.get(key);
      if (!r || !r.enabled) return false;
      return r.run_window === runWindow;
    };
    const prio = (key: string) => ruleMap.get(key)?.priority ?? 100;

    // ---- load users ------------------------------------------------------
    const { data: users } = await supabase
      .from("users")
      .select(
        "id, auth_user_id, first_name, academic_stage, free_practice_access, free_access_expiry_date, trial_started_at, is_suspended",
      )
      .eq("is_suspended", false)
      .not("auth_user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_USERS);

    const userList = users || [];
    const userIds = userList.map((u: any) => u.id);
    if (userIds.length === 0) return json({ processed: 0 });

    // preferences (push opt-out)
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("user_id, push_notifications, default_exam_type")
      .in("user_id", userIds);
    const prefMap = new Map((prefs || []).map((p: any) => [p.user_id, p]));

    // streaks / activity
    const { data: streaks } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_practice_date")
      .in("user_id", userIds);
    const streakMap = new Map((streaks || []).map((s: any) => [s.user_id, s]));

    // active paid subscriptions ending soon
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, status, end_date")
      .in("user_id", userIds)
      .eq("status", "ACTIVE");
    const subMap = new Map((subs || []).map((s: any) => [s.user_id, s]));

    const candidates: Candidate[] = [];
    const push = (c: Candidate) => candidates.push(c);
    const today = todayKey();

    for (const u of userList) {
      const name = u.first_name || "there";
      const trialEnd = u.free_access_expiry_date ? new Date(u.free_access_expiry_date) : null;
      const daysLeft = trialEnd ? daysBetween(new Date(), trialEnd) * -1 : null;
      const onTrial = !!u.trial_started_at && !!u.free_practice_access;
      const trialStartedDays = u.trial_started_at
        ? daysBetween(new Date(), new Date(u.trial_started_at))
        : null;

      // --- trial lifecycle ---
      if (onTrial && daysLeft !== null) {
        if (daysLeft === 0 && trialStartedDays === 0 && ruleActive("trial_started")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_started",
            priority: prio("trial_started"),
            title: "Your free trial is live 🎉",
            body: `${name}, you have full access to Edura. Start your first practice test now.`,
            route: "/dashboard", dedupeKey: "once", type: "success",
          });
        }
        if (trialStartedDays === 7 && daysLeft > 3 && ruleActive("trial_day7")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_day7",
            priority: prio("trial_day7"),
            title: "One week into your trial",
            body: `${name}, keep the momentum going — take a mock test today and see your rank.`,
            route: "/cbt", dedupeKey: "once",
          });
        }
        if (daysLeft === 3 && ruleActive("trial_3_days_left")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_3_days_left",
            priority: prio("trial_3_days_left"),
            title: "3 days left on your free trial",
            body: "Keep your full access — upgrade now so your practice never stops.",
            route: "/subscription", dedupeKey: "once", type: "warning",
          });
        }
        if (daysLeft === 1 && ruleActive("trial_1_day_left")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_1_day_left",
            priority: prio("trial_1_day_left"),
            title: "Your trial ends tomorrow",
            body: `${name}, upgrade today to keep premium practice, mocks and study tools.`,
            route: "/subscription", dedupeKey: "once", type: "warning",
          });
        }
      }

      if (u.trial_started_at && daysLeft !== null && daysLeft < 0) {
        if (daysLeft === -1 && ruleActive("trial_ended")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_ended",
            priority: prio("trial_ended"),
            title: "Your free trial has ended",
            body: "Upgrade any time to restore premium practice and study tools.",
            route: "/subscription", dedupeKey: "once", type: "warning",
          });
        }
        if (daysLeft === -4 && ruleActive("trial_winback")) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "trial_winback",
            priority: prio("trial_winback"),
            title: "Still preparing? We kept your progress",
            body: `${name}, your scores and streak are safe. Come back and continue where you stopped.`,
            route: "/subscription", dedupeKey: "once",
          });
        }
      }

      // --- paid subscription expiring ---
      const sub: any = subMap.get(u.id);
      if (sub?.end_date && ruleActive("sub_expiring")) {
        const d = daysBetween(new Date(), new Date(sub.end_date)) * -1;
        if (d === 3 || d === 1) {
          push({
            userId: u.id, authUserId: u.auth_user_id, ruleKey: "sub_expiring",
            priority: prio("sub_expiring"),
            title: d === 1 ? "Your plan expires tomorrow" : "Your plan expires in 3 days",
            body: "Renew now to keep uninterrupted access to premium practice.",
            route: "/subscription", dedupeKey: String(sub.end_date), type: "warning",
          });
        }
      }

      // --- study nudges ---
      const st: any = streakMap.get(u.id);
      const lastPractice = st?.last_practice_date ? new Date(st.last_practice_date) : null;
      const daysSince = lastPractice ? daysBetween(new Date(), lastPractice) : null;

      if (ruleActive("streak_at_risk") && st?.current_streak > 0 && daysSince === 1) {
        push({
          userId: u.id, authUserId: u.auth_user_id, ruleKey: "streak_at_risk",
          priority: prio("streak_at_risk"),
          title: `Don't lose your ${st.current_streak}-day streak 🔥`,
          body: "A quick 10-question practice keeps it alive.",
          route: "/cbt", dedupeKey: today,
        });
      }

      if (ruleActive("inactive_3_days") && (daysSince === null || daysSince >= 3)) {
        push({
          userId: u.id, authUserId: u.auth_user_id, ruleKey: "inactive_3_days",
          priority: prio("inactive_3_days"),
          title: "Your books are waiting 📚",
          body: `${name}, it's been a few days. Try one short practice set tonight.`,
          route: "/cbt", dedupeKey: today,
        });
      }

      if (ruleActive("weekly_recap") && new Date().getUTCDay() === 0) {
        push({
          userId: u.id, authUserId: u.auth_user_id, ruleKey: "weekly_recap",
          priority: prio("weekly_recap"),
          title: "Your week in review",
          body: `Streak: ${st?.current_streak ?? 0} days. Set your goal for the new week.`,
          route: "/dashboard", dedupeKey: today,
        });
      }

      // --- exam countdown ---
      if (ruleActive("exam_countdown") && u.academic_stage !== "undergraduate" && u.academic_stage !== "graduate") {
        const examType = (prefMap.get(u.id) as any)?.default_exam_type || "JAMB";
        const examDate = getExamDate(examType);
        if (examDate) {
          const d = daysBetween(new Date(), examDate) * -1;
          if ([60, 30, 14, 7, 3, 1].includes(d)) {
            push({
              userId: u.id, authUserId: u.auth_user_id, ruleKey: "exam_countdown",
              priority: prio("exam_countdown"),
              title: `${d} day${d === 1 ? "" : "s"} to ${examType}`,
              body: d <= 7
                ? "Final stretch — revise your weakest topics today."
                : "Stay consistent. A timed mock today sharpens your speed.",
              route: "/cbt", dedupeKey: `${examType}-${d}`,
            });
          }
        }
      }
    }

    // --- campus tasks due (morning) ---
    if (ruleActive("campus_tasks_due")) {
      const soon = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const [tasks, milestones, nysc] = await Promise.all([
        supabase.from("campus_tasks").select("user_id, title, due_date").eq("is_done", false).lte("due_date", soon).gte("due_date", today),
        supabase.from("campus_project_milestones").select("user_id, title, due_date").eq("is_done", false).lte("due_date", soon).gte("due_date", today),
        supabase.from("campus_nysc_tasks").select("user_id, label, due_date").eq("is_done", false).lte("due_date", soon).gte("due_date", today),
      ]);
      const rows = [
        ...(tasks.data || []).map((t: any) => ({ user_id: t.user_id, title: t.title, route: "/campus" })),
        ...(milestones.data || []).map((t: any) => ({ user_id: t.user_id, title: t.title, route: "/campus/projects" })),
        ...(nysc.data || []).map((t: any) => ({ user_id: t.user_id, title: t.label, route: "/campus/nysc" })),
      ];
      const byUser = new Map<string, any[]>();
      for (const r of rows) {
        if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
        byUser.get(r.user_id)!.push(r);
      }
      for (const [uid, items] of byUser) {
        const u = userList.find((x: any) => x.id === uid);
        if (!u) continue;
        push({
          userId: uid, authUserId: u.auth_user_id, ruleKey: "campus_tasks_due",
          priority: prio("campus_tasks_due"),
          title: items.length > 1 ? `${items.length} tasks due today` : "A task is due today",
          body: items.slice(0, 2).map((i) => i.title).join(" • "),
          route: items[0].route, dedupeKey: today,
        });
      }
    }

    // ---- pick one per user (highest priority = lowest number) ----------
    const best = new Map<string, Candidate>();
    for (const c of candidates) {
      const existing = best.get(c.userId);
      if (!existing || c.priority < existing.priority) best.set(c.userId, c);
    }
    const chosen = [...best.values()];

    if (dryRun) return json({ window: runWindow, would_send: chosen.length, sample: chosen.slice(0, 5) });

    // ---- dedupe via notification_log (unique constraint) ---------------
    const sent: Candidate[] = [];
    for (const c of chosen) {
      const { error } = await supabase.from("notification_log").insert({
        user_id: c.userId,
        rule_key: c.ruleKey,
        dedupe_key: c.dedupeKey,
        channel: "inapp",
      });
      if (!error) sent.push(c);
    }

    if (sent.length > 0) {
      await supabase.from("notifications").insert(
        sent.map((c) => ({
          user_id: c.userId,
          title: c.title,
          message: c.body,
          type: c.type || "info",
          metadata: { route: c.route, rule: c.ruleKey, automated: true },
        })),
      );

      // ---- push, grouped by identical message ---------------------------
      const groups = new Map<string, Candidate[]>();
      for (const c of sent) {
        const key = `${c.title}|${c.body}|${c.route}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(c);
      }
      for (const [, group] of groups) {
        const authIds = group
          .filter((c) => {
            const p: any = prefMap.get(c.userId);
            return !p || p.push_notifications !== false;
          })
          .map((c) => c.authUserId)
          .filter(Boolean) as string[];
        if (authIds.length === 0) continue;
        for (let i = 0; i < authIds.length; i += 200) {
          try {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                userIds: authIds.slice(i, i + 200),
                title: group[0].title,
                body: group[0].body,
                route: group[0].route,
              },
            });
          } catch (e) {
            console.error("push failed", e);
          }
        }
      }
    }

    // ---- rule stats -----------------------------------------------------
    const counts = new Map<string, number>();
    for (const c of sent) counts.set(c.ruleKey, (counts.get(c.ruleKey) || 0) + 1);
    for (const [ruleKey, count] of counts) {
      const r: any = ruleMap.get(ruleKey);
      await supabase
        .from("notification_rules")
        .update({
          last_run_at: new Date().toISOString(),
          last_sent_count: count,
          total_sent_count: (r?.total_sent_count || 0) + count,
        })
        .eq("rule_key", ruleKey);
    }
    await supabase
      .from("notification_rules")
      .update({ last_run_at: new Date().toISOString() })
      .eq("run_window", runWindow)
      .eq("enabled", true);

    // release lock
    await supabase.from("system_settings").upsert(
      { key: LOCK_KEY, value: "", description: "Notification engine run lock" },
      { onConflict: "key" },
    );

    return json({ window: runWindow, evaluated: userList.length, sent: sent.length });
  } catch (e) {
    console.error("notification-engine error", e);
    await supabase.from("system_settings").upsert(
      { key: LOCK_KEY, value: "", description: "Notification engine run lock" },
      { onConflict: "key" },
    ).catch?.(() => {});
    return json({ error: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Approximate national exam windows; adjust yearly from admin settings later.
function getExamDate(examType: string): Date | null {
  const year = new Date().getFullYear();
  const map: Record<string, string> = {
    JAMB: `${year}-04-25`,
    WAEC: `${year}-05-05`,
    NECO: `${year}-06-20`,
  };
  const raw = map[String(examType).toUpperCase()];
  if (!raw) return null;
  const d = new Date(raw);
  if (d.getTime() < Date.now()) d.setFullYear(year + 1);
  return d;
}
