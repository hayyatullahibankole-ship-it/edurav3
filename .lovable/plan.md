# Mobile App Leftovers — Audit Result and Cleanup Plan

## Audit result

The build and typecheck are both clean (`build OK`, no TypeScript errors), and no runtime errors were captured. A link audit across every route found **no dead links**: all 124 static routes and all dynamic navigation targets resolve.

The only leftovers found are small placeholder stubs, none of which break the mobile app:

| Location | Leftover |
|---|---|
| `src/pages/Payment.tsx` | A plan card shows "Features coming soon" instead of a feature list |
| `src/pages/InstallApp.tsx` | "Google Play listing coming soon" notice (accurate until the listing is live) |
| `src/components/school/QuickActions.tsx` | "Report download feature coming soon" toast (school web dashboard, not mobile) |
| `src/components/admin/ResourceManagement.tsx` | Resource edit shows "Edit functionality coming soon" (admin only) |
| `src/components/JambCBTInterface.tsx` | Two native `alert()` popups for tab-switch and blocked-action warnings — jarring on mobile compared with the app's toast style |

## Proposed cleanup

1. **Replace the CBT native alerts with in-app toasts/dialogs** in `JambCBTInterface.tsx` so exam warnings match the rest of the mobile UI and can't be dismissed by the OS chrome.
2. **Fill in the Payment plan features** so no plan card renders an empty "coming soon" state on mobile.
3. **Wire the school Quick Actions report download** to the existing results export, or hide the button until it exists.
4. **Enable resource editing in the admin resource manager** (reuse the existing create dialog in edit mode).

Items 1 and 2 are the only ones users see in the mobile app; 3 and 4 are dashboard polish.

## Technical notes

- No schema, edge function, or navigation changes are required.
- Campus AI limits stay at 100 free / 500 premium credits per day.
- Changes are presentation-only except the admin edit dialog, which reuses the existing update mutation.
