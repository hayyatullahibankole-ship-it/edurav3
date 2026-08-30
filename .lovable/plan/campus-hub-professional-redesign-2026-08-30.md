# Campus Hub Professional Redesign

## Direction

Rebuild Campus Hub around the selected **Modern Editorial Hub** composition, adapted to Akboy rather than copied literally:

- Fresh Campus palette: forest `#116149`, clean white `#FDFEFE`, mist `#E7F1ED`, and lime `#BFE36C` through semantic `akboy-*` tokens.
- A confident editorial display face paired with a clean contemporary sans; typography will be substantial and readable rather than oversized or newspaper-thin.
- No gradients, Edura branding, rainbow categories, excessive empty space, or generic AI/SaaS styling.
- Moderate corner radii, strong imagery, layered hierarchy, and restrained motion.

## Page rebuild

1. **Compact brand introduction**
   - Replace the oversized newspaper masthead with a concise Akboy Campus Hub identity, value proposition, search, and useful category navigation.
   - Keep the first screen content-rich on desktop and mobile.

2. **Featured editorial composition**
   - Use a large lead-story image with a readable solid overlay treatment and clear article metadata.
   - Pair it with a prominent forest consultancy panel containing the WhatsApp action and relevant service pathways.
   - Add three supporting stories beneath as balanced editorial summaries rather than long numbered briefs.

3. **Modern discovery sections**
   - Present latest stories in a polished image-led grid/feed with consistent hierarchy.
   - Keep category, institution, search, URL filter, pagination, and WhatsApp sharing behavior intact.
   - Retain institution logo support and intentional monogram fallbacks, never the Edura logo.

4. **Consultancy and conversion tools**
   - Integrate admissions guidance, eligibility checking, recommendations, newsletter signup, and consultation actions into the same visual system.
   - Avoid isolated utility blocks that look unrelated to the publication.

5. **Responsive experience**
   - On mobile, stack the featured story and consultancy panel, keep categories horizontally scrollable, use compact story cards, and prevent horizontal overflow.
   - Preserve clear tap targets and keep the floating WhatsApp control unobtrusive.

## Technical details

- Refactor `AkboyCampusHub.tsx` presentation while retaining its existing Supabase query, filters, lead rotation, pagination, sharing, and routing logic.
- Align `CampusHubAdvanced.tsx` with the selected design where it appears on this page.
- Reuse `PostImage`, `InstitutionLogo`, the existing Akboy layout, and semantic Tailwind tokens.
- Extend the Akboy token set only where needed for the locked Fresh Campus palette; do not place raw colors in page components.
- Respect reduced-motion preferences for image hover and section reveal behavior.

## Verification

- Run the TypeScript check and confirm the preview build reports no errors.
- Test search, category and institution filtering, article links, pagination, consultation actions, and WhatsApp sharing.
- Visually verify at 390px and 1440px, including first-screen hierarchy, image handling, readable text, tap targets, and zero horizontal overflow.
