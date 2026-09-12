# AKBOY Website Expansion — Products, Community, Events

Extend the existing AKBOY site and the existing admin dashboard. Nothing is rebuilt, no second admin or login, no second news system. Everything new is database-driven so you can add products, ambassadors, schools and events yourself without code.

## Navigation

Final menu: Services | Products | Learn | Campus Hub | Community | About | Get Started.
Products and Community are new. Ambassadors, Partner Schools and Events stay inside those menus, not as top-level items.

## New public pages

- `/products` — "Education Technology Built to Solve Real Problems", cards for Edura (Live) and School OS (In Development), plus a "What We're Building Next" note.
- `/products/edura` and `/products/school-os` — both rendered by one dynamic template, so a third product added in admin works automatically.
- Product page sections: hero (logo, tagline, image, status, CTA), The Problem, The Solution, Who It Is For, Features, How It Works, Screenshots, optional video, CTA, related Campus Hub articles.
- School OS page carries the four-stakeholder block (Management, Staff, Parents, Students) and a waitlist CTA. Multi-tenancy wording stays off until it exists.
- `/community` — Student Ambassadors, Partner Schools, Community Initiatives.
- `/community/ambassadors` — programme explanation plus ambassador cards (photo, name, school, role, cohort).
- `/community/partners` — schools grouped by relationship: Technology, Programme, Strategic.
- `/learn/events` and `/learn/events/[slug]` — event pages driven by the existing events records, including the September 30, 2026 "Future Ready" programme with About, Why, Who It's For, Highlights, Speakers, Participating Schools, Ambassadors, Venue, Schedule, Registration.

## Homepage additions

Added to the existing home page, all controlled from admin:
1. "Technology Built for Education" — featured products.
2. Featured programme banner (Future Ready, Sept 30 2026) — swappable later.
3. Community section with three cards.
4. "Growing With Schools" partner logo strip.
5. Impact numbers, shown only once you enter verified figures.

## Admin (inside the dashboard you already use)

New entries under the existing Akboy group: Products, Ambassadors, Partner Schools, Homepage; the current Events manager is extended.

- Products: name, slug, category, descriptions, status, logo, cover, screenshots, problem/solution/audience, repeatable features (+ Add Feature), how-it-works steps, FAQs, video, CTA text and link, featured, order, published, SEO fields. Draft → Preview → Publish.
- Ambassadors: name, photo, school, role, cohort, bio, social links, order, featured, active, published.
- Partner Schools: one master record per school (name, logo, location, website, relationship type, description, start date, featured, order, published). The same record is reused in events and on the homepage — never duplicated.
- Events: existing fields plus theme, slug, start/end time, venue, status (Draft/Upcoming/Ongoing/Completed/Cancelled), featured, published; tabs for Speakers, Participating Schools (pick from partner schools), Ambassadors (pick from ambassadors), Media gallery. After the event you switch status to Completed and add highlights, photos, attendance and outcomes.
- Homepage: choose featured products, featured event, featured ambassadors, featured schools, and set impact statistics.

Media uses the existing Akboy image storage — no new upload system.

## Campus Hub

Stays the single news platform. Articles can link to a product, event, community or partner page, and product/event pages show related articles.

## Build order

1. Database tables and access rules.
2. Products admin.
3. Public Products page.
4. Dynamic product detail template + Edura and School OS content.
5. Ambassadors and Partner Schools admin.
6. Community public pages.
7. Events extension + September event page.
8. Event relationships (schools, ambassadors, speakers).
9. Homepage: products, featured programme, community.
10. Partner strip + impact.
11. Campus Hub cross-linking.
12. SEO, analytics, performance, security.
13. QA across desktop, tablet, mobile.

## Technical notes

- New tables following existing naming: `akboy_products`, `akboy_product_features`, `akboy_product_media`, `akboy_ambassadors`, `akboy_partner_schools`, `akboy_event_speakers`, `akboy_event_media`, `akboy_event_schools`, `akboy_event_ambassadors`, `akboy_homepage_settings`. `akboy_events` gains slug, theme, times, venue, status, featured, published.
- Access rules mirror the existing Akboy tables: anonymous read limited to published/active rows, writes restricted to admins via the existing role check. Drafts are never returned publicly.
- Routes are registered in the existing router for both `akboy.space` root paths and the `/akboy/...` prefix on the Edura domain; all detail routes resolve by database slug.
- Pages are wrapped in the existing Akboy layout so brand tokens (forest/butter/cream, Fraunces/Playfair), navbar, footer and per-page SEO/OG tags come for free. No gradients.
- Images upload through the existing `ImageUpload` component and `akboy-images` bucket; galleries lazy-load and logos render at constrained sizes.
- Only Edura and School OS are seeded; no speculative products.
