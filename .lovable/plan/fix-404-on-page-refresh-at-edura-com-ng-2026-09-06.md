# Fix: 404 on page refresh at edura.com.ng

## Diagnosis (confirmed)

edura.com.ng is **not connected to this Lovable project as a custom domain**. Its DNS A record points to `216.198.79.1` — a Vercel anycast IP — not to Lovable (`185.158.133.1`).

So visitors reaching edura.com.ng are being served by a different host (a Vercel deployment or a forwarding setup), not by Lovable. That host serves `index.html` at `/` but has no SPA fallback: when you refresh on a deep path like `/dashboard` or `/login`, the server looks for a real file at that path, finds none, and returns its own 404.

The app code is correct — it uses `BrowserRouter` with clean paths, and Lovable hosting has built-in SPA fallback (deep-link refresh already works on `edurav3.lovable.app`). Nothing in the React app causes this.

## Fix — two options (pick one)

### Option A (recommended): Connect edura.com.ng to Lovable properly
1. In the domain registrar / DNS provider for edura.com.ng (nameservers are `ns1-4.host-ww.net`), change the A record for `@` (and `www`) from `216.198.79.1` to **`185.158.133.1`**.
2. In **Project Settings → Domains**, connect `edura.com.ng` and `www.edura.com.ng`, complete the TXT verification, and set one as Primary.
3. Wait for DNS propagation and automatic SSL. Lovable's SPA fallback then serves every route correctly — refresh on any page works.
4. Remove/retire the old Vercel deployment so it can't serve stale versions.

Note: the domain also carries Zoho Mail MX/SPF records — those stay untouched; only the A record changes.

### Option B: Keep the current host, add SPA fallback there
If edura.com.ng must stay on the external host (Vercel), that deployment needs a rewrite rule so all paths serve `index.html`:
- Vercel: add `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` to whatever project is deployed there (that config lives in the Vercel deployment, and this repo's build would need to be the thing deployed).
- Downside: you maintain two deploy pipelines; the Vercel copy can drift from the Lovable preview.

## What I will do in the app (either option)
- No code changes are required for Option A.
- For Option B I can commit a `vercel.json` + ensure the repo builds standalone so the external host can serve it.

## Verification
- After DNS/host change: `curl -I https://edura.com.ng/dashboard` returns 200 (not 404).
- Refresh on `/login`, `/dashboard`, `/akboy/campus-hub` in the browser loads the app.
