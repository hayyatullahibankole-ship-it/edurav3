# Domain switch to edura.com.ng + Akboy event registration forms

## 1. Replace edura.space / edura.ng with edura.com.ng

Every place the old domain appears gets updated:

- `index.html` — og:url and canonical
- `src/hooks/useDomainDetection.tsx` — add `edura.com.ng` and `www.edura.com.ng` to the Edura domain list (keep the old ones so existing links still resolve)
- `src/lib/nativePayments.ts` — `WEB_APP_ORIGIN`
- `src/components/Footer.tsx` — support email
- `src/components/AccountSettings.tsx` — support email in error copy
- `src/components/admin/SystemConfig.tsx` — default admin email
- `src/pages/DeleteAccount.tsx` — canonical URL and both emails
- `src/utils/schoolManualGenerator.ts` — all www.edura.ng / support@edura.ng references

## 2. Privacy Policy and Terms contact details

Both pages get a consistent contact block:

- Privacy: privacy@edura.com.ng, DPO dpo@edura.com.ng, support@edura.com.ng
- Terms: support@edura.com.ng, phone 0705 075 7085, Lagos, Nigeria
- Remove the placeholder phone number `+234 (0) 123 456 7890` currently in Terms
- Update the website reference to edura.com.ng in both

## 3. Emails sent from the backend

Update sender addresses and links in the edge functions that send mail:

- `send-welcome-email`, `send-receipt-email`, `send-subscription-reminders` — replace edura.space links/emails with edura.com.ng, and set the from address to the new domain (e.g. `Edura <noreply@edura.com.ng>`, support replies to `support@edura.com.ng`)
- Any other function using a hardcoded sender gets the same treatment

Note: for these emails to actually deliver, `edura.com.ng` must be verified in Resend (DNS records). I will update the code; you will need to add the domain in Resend if it is not already verified.

## 4. Akboy events: registration form

Currently the Register button either opens an external URL or sends people to the contact page. Replacing that with a real in-app form.

**Database**
- Add a `form_fields` JSONB column to `akboy_events` holding the list of questions for that event
- New table `akboy_event_registrations` (event_id, full_name, email, phone, responses JSONB, status, created_at) with grants, RLS: public insert, admin-only read

**Default question set** (pre-filled on every new event, admin can then delete or add):
Full name, Email, Phone number, Occupation / school, How did you hear about us?, Additional notes

**Public page (`AkboyEvents.tsx`)**
- Register opens a dialog that renders the event's fields dynamically
- Field types: short text, long text, email, phone, number, dropdown (with options), checkbox
- Required-field validation client-side, success confirmation after submit
- Respects `max_participants`: shows "Fully booked" when seats are exhausted
- If the event has an external `registration_url`, that still takes priority

**Admin (`AkboyEventsManager.tsx`)**
- Inside the event editor, a "Registration form" section listing the fields
- Add field / delete field / reorder, edit label, type, required flag and dropdown options
- New "Registrations" view per event: table of everyone who signed up, their answers, and CSV export

## Technical notes

- Fields stored as `[{ id, label, type, required, options?, placeholder? }]`; answers stored keyed by field id in `responses`
- Existing events without `form_fields` fall back to the default set so nothing breaks
- Zod validation on submit; input length limits on all free-text answers
