# Fix mobile exam controls overlapping navigation

## What will change

- Hide the regular Edura mobile navigation while a student is inside an active exam.
- Keep the exam’s question-number strip and Previous, grid, Next, and Submit controls fixed at the bottom as the only navigation during the exam.
- Preserve phone safe-area spacing so the controls remain above Android gesture/navigation areas.
- Apply the same behavior to practice and attempt-based exam routes, then check mock and challenge exam entry points for the same conflict.

## Verification

- Open an active exam at the current mobile size and confirm the question numbers and action buttons are fully visible and clickable.
- Confirm no bottom overlap or horizontal scrolling occurs.
- Confirm the standard mobile navigation returns after leaving the exam.
- Run the existing exam smoke tests and verify the preview build succeeds.

## Technical details

- Use the existing `showMobileNav` layout control on active exam routes rather than adding more bottom spacing between two competing fixed bars.
- Keep the shared exam console’s current safe-area-aware bottom panel and ensure its page padding matches the panel height.
