# Fix AI Tutor and add the official NABTEB logo

## 1. Rebuild the AI Tutor as a true app screen

- Remove the framed, embedded-card treatment on desktop and give the tutor a dedicated edge-to-edge workspace within the Edura shell.
- On mobile, use the actual visible viewport height rather than relying only on a fixed `100dvh` container, so the header, transcript, and composer remain usable when the Android keyboard opens.
- Keep exactly one scrolling region: the message transcript. The header and composer stay fixed in the layout without covering messages or the phone safe areas.
- Make scroll-follow state explicit: new and streaming replies follow only when the student was already near the bottom; scrolling upward pauses auto-follow, and returning to the bottom resumes it.
- Polish the empty state, conversation rows, and composer into one coherent native chat UI while preserving history, image/camera input, voice input, copy, retry, rename, and delete behavior.
- Ensure mobile history actions remain visible and tappable rather than depending on desktop hover states.

## 2. Use the uploaded NABTEB logo where NABTEB is supported

- Upload the supplied NABTEB artwork as a managed static asset and add it to the shared exam/provider logo mapping.
- Replace the remote Google favicon fallback in NABTEB service cards, filters, and service rows with the official uploaded mark.
- Replace the generic NABTEB award icon in the landing-page services showcase with the shared provider logo component.
- Add NABTEB to the public “Built for” logo strip because the landing copy already advertises NABTEB result-checker services.
- Do not add a NABTEB CBT exam button unless there is an actual NABTEB question flow behind it; this update will use the logo only on genuine NABTEB surfaces.

## 3. Verification

- Check the AI Tutor at phone and desktop sizes for transcript scrolling, keyboard/composer clearance, streaming follow behavior, history access, and no nested/embedded appearance.
- Check the home and services surfaces to confirm the NABTEB mark is crisp, contained, and consistent with the JAMB, WAEC, NECO, and Post-UTME marks.
- Confirm the production build remains clean.

## Technical details

- Main tutor files: `src/pages/AITutor.tsx` and `src/components/ai/AITutorChat.tsx`.
- Logo integration: `src/components/edura/ProviderLogo.tsx`, `src/components/edura/ExamBadge.tsx` where applicable, `src/components/edura/ServicesShowcase.tsx`, and `src/pages/Home.tsx`.
- The uploaded image is the official NABTEB logo and will be stored through the project asset flow rather than as a repository binary.
