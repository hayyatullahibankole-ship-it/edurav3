# Diagram support for questions

Right now a question can only be text. There is a place in the database to store pictures for a question, but nothing in the app puts pictures there, and nothing shows them — so diagram questions (maps, graphs, circuits, biology drawings) can't be used at all.

## What you'll be able to do

- Add one or more diagrams to any question from the admin question editor (upload from your device, drag and drop, with a caption).
- Add a small picture to an individual option, for questions where the answers themselves are diagrams.
- See diagrams in the exam screen, on mobile and desktop, tappable to zoom full screen.
- See the same diagrams in answer review and in the school exam and mock exam screens.
- Include image links in bulk upload spreadsheets.
- Diagrams that come from the question APIs (ALOC/SdashAPI already send an image field) get stored and shown automatically.

## How it works

- New public storage bucket `question-media` for uploaded diagrams; admin-only writes, public reads so exams load fast and work offline once cached.
- Question images are stored in the existing `questions.media_urls` field as a list of `{ url, caption }`. Option images stored in a new `option_media` field so options stay plain text for grading.
- The question-fetch database functions already return `media_urls`; add `option_media` to them so the exam screen receives both.
- `useCBTExam` maps images onto each question (`media`, `optionMedia`) and keeps option images aligned when options are shuffled.
- A shared `QuestionMedia` component (image, caption, lazy loading, zoom dialog, broken-image fallback) is used by `CleanCBTInterface`, `MockCBTInterface`, `CleanAnswerReviewCard`, `QuestionReviewCard`, `ChallengeDetail` and the school exam screens.
- Admin: image uploader added to the create/edit dialogs in `QuestionManagement` and `SchoolQuestionManager`, plus an `image_url` column in `SimpleBulkUpload`.
- Import: `sync-external-questions` already maps the provider `image` field; verify it persists and renders.

## Steps

1. Migration: create the `question-media` bucket with admin-write/public-read policies, add `option_media` to `questions`, and update the question-fetch functions to return it.
2. Build the upload widget and the shared `QuestionMedia` display component.
3. Wire the admin editors, bulk upload, and school question manager.
4. Wire exam, mock, challenge and review screens.
5. Verify with a real diagram question end to end: create in admin, take it in the app on a phone-sized screen, review the answer.
