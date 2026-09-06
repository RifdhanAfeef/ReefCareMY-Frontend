# ReefCare MY — Combined Usability Fixes

This package combines Lee's Finding 4, 5 and 8 work with the Finding 1, 3 and 6 changes and the requested coordinator and location refinements.

## Apply the package

Extract the ZIP directly into the root of the current `ReefCare_MY_FrontEnd` project and allow files with the same paths to be replaced. The archive contains changed and new files only; it does not contain `.git`, `.next`, `node_modules`, environment files, or unchanged project files.

## Included improvements

- Finding 1: preserves the selected threat/category identifier and evidence through review and submission; adds explicit photo-reselection recovery and category payload regression coverage.
- Finding 3: auto-formats typed dates as `dd/mm/yyyy`, retains the native calendar control, and prevents future calendar selections for both observation and Dive Session dates.
- Finding 4: gives observers with no Dive Sessions one clear creation action, separates loading/error/empty states, and displays a selected general dive site as read-only text on the location step.
- Finding 5: improves mobile header, report review and map layouts; avoids hiding overflow globally; keeps threat cards visible independently of scroll effects; disables decorative water animation on small screens; adds request timeouts, retry paths and a map-tile fallback.
- Finding 6: provides a reusable live password checklist and accessible show/hide control. Observer registration visibly requires at least 6 characters and at least 4 distinct characters. Administrator-created temporary passwords use the backend-documented 12-character minimum. The internal 128-character API limit is still enforced but is not shown to users.
- Finding 8: removes the duplicate landing-page registration action, adds accessible location progress, restores heading focus and scroll position after same-page step changes, and places the report/location summary before submission.
- Coordinator refinements: redirects coordinator login to the report queue, formats evidence upload timestamps, loads protected evidence inline, keeps assessment notes blank initially, and makes all queue counts and pagination reflect the active search/site/ownership filters.

## Backend and product notes

- Ordinary observer registration uses the documented 6-character minimum. The administrator account-creation contract separately specifies 12–128 characters for temporary passwords, so the administrator preview uses 12 while keeping the maximum out of the visible checklist.
- Historical dates are currently allowed without an age limit; future dates are rejected. The product team should confirm whether unusually old observations need a warning or maximum age.
- The coordinator queue implementation loads the active submitted-report pages from the current backend queue contract, then applies the visible filters and pagination to the complete loaded set.

## Verification completed

- Automated tests: 96 passed across 22 test files
- TypeScript: passed
- ESLint: passed
- Next.js production build: passed

An authenticated smoke test against the deployed backend is still recommended after integration because production data, CORS and deployed authentication cannot be fully proven by the local automated suite.
