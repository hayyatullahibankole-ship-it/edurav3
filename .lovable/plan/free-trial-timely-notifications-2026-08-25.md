# Free Trial + Timely Notifications

Two connected pieces: give every student a real free window when they join, then use automated, well-timed notifications to convert them and keep them coming back.

## 1. Free trial (recommendation: 30 days, admin-adjustable)

30 days is the sweet spot for exam-prep apps: long enough for a student to feel the value (a full study cycle, mock tests, results), short enough that you start earning while they are still motivated. 60 days trains people to expect free and pushes payment past the point where many stop studying. So: default 30 days, but stored as a setting you can change to 14, 45 or 60 anytime without a code change.

How it works:
- On signup, the account is automatically granted trial access for the configured number of days.
- All existing users who don't have an active paid plan get a trial starting from the day this ships (as you chose).
- During the trial the user sees a clear "Free trial - X days left" chip on the home screen and in the subscription page, with a "Keep my access" upgrade button.
- When the trial ends, the account drops to the free/basic tier automatically. Nothing is deleted; premium features re-lock.
- Admin gets a Trials panel: current trial length, count of active trials, ending-this-week, converted vs expired, and the ability to extend or grant a trial to a specific user.

## 2. Timely notifications

A single scheduled engine runs daily and sends the right message to the right student, in-app + push (and email for the important money ones). Recommended send times (Lagos): main daily run 7:00 PM, when students are settled and study intent is highest; a light morning run at 7:30 AM for exam-countdown and streak-at-risk reminders. Nothing sends between 10 PM and 6:30 AM.

Notification set:
- Trial lifecycle: trial started (day 0), day 7 check-in, 3 days left, 1 day left, trial ended, plus a win-back 3 days after expiry.
- Subscription: renewal reminders and expiry (extends what already exists).
- Study nudges: streak at risk (evening, if no activity today), "you haven't practiced in 3 days", weekly progress recap on Sunday evening.
- Exam countdown: JAMB/WAEC milestones (60, 30, 14, 7, 3, 1 days out) tailored to the student's exam type, plus a weekly goal reminder.
- Transactional (instant, not scheduled): results ready, service request status changes, wallet funding, scratch-card delivery, ebook access granted.
- News & announcements: when you publish education/admission news or an event, it fans out as a notification to relevant students (all, or filtered by stage - candidate vs campus).
- Campus-specific: logbook reminder, project milestone due, NYSC task due.

Guardrails so it never feels spammy:
- Max 1 scheduled notification per user per day (priority order: trial/billing > exam countdown > study nudge > news).
- Respects the existing notification preferences; a "Notification settings" screen lets students mute categories.
- Every send is logged so the same message is never repeated to the same user.

Admin side: the existing Notification Manager gains an "Automated" tab showing each rule, whether it's on, when it last ran, and how many were delivered - so you can switch any rule off.

## Technical notes

- Settings: trial length + notification toggles stored in `system_settings`; no redeploy needed to change them.
- Trial grant reuses the existing `free_practice_access` / `free_access_expiry_date` fields on `users` (already honoured by `useSubscription` and `has_premium_access`), set in the signup trigger for new users and by a one-off backfill for existing users. Adds `trial_started_at` and `trial_source` for reporting.
- New `notification_rules` + `notification_log` tables (user_id, rule_key, sent_at, unique per user/rule/window) for dedupe and admin stats.
- New edge function `notification-engine`: one daily entry point that evaluates all rules, writes to `notifications`, and calls the existing `send-push-notification` (FCM v1) plus Resend for the billing emails. Scheduled with pg_cron via `run_sql` at 19:00 and 07:30 Lagos (18:00 / 06:30 UTC).
- News/event publish triggers a fan-out through the same engine so it stays deduped and rate-limited.
- Front end: trial countdown chip in `Dashboard.tsx` / subscription page, trial state exposed from `useSubscription`, notification preferences screen, admin Trials panel and Automated tab in `NotificationManager.tsx`.
