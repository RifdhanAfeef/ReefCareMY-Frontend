# Folder and page assignments

The folders in parentheses are Next.js route groups. They organise files by audience but do not appear in the public URL.

The numbering below intentionally follows the latest Iteration 1 user-story document: Epics 1, 2, 4, 5 and 6 are included, while Epic 3 is not listed in that version.

| Work area | Route shown in the browser | Page file to edit | Feature folder |
| --- | --- | --- | --- |
| Landing page | `/` | `app/(public)/page.tsx` | `features/landing/` |
| Login | `/login` | `app/(auth)/login/page.tsx` | `features/epic-01-access/` |
| Registration | `/register` | `app/(auth)/register/page.tsx` | `features/epic-01-access/` |
| Epic 1 — users | `/admin/users` | `app/(admin)/admin/users/page.tsx` | `features/epic-01-access/` |
| Epic 1 — role requests | `/admin/role-requests` | `app/(admin)/admin/role-requests/page.tsx` | `features/epic-01-access/` |
| Epic 1 — review access request | `/admin/role-requests/[requestId]` | `app/(admin)/admin/role-requests/[requestId]/page.tsx` | `features/epic-01-access/` |
| Epic 1 — ownership views | `/coordinator/my-cases` | `app/(coordinator)/coordinator/my-cases/page.tsx` | `features/epic-01-access/` |
| Epic 2 — guidance | `/learn` | `app/(public)/learn/page.tsx` | `features/epic-02-reporting/` |
| Epic 2 — observation | `/report-a-reef` | `app/(observer)/report-a-reef/page.tsx` | `features/epic-02-reporting/` |
| Epic 2 — review | `/report-a-reef/review` | `app/(observer)/report-a-reef/review/page.tsx` | `features/epic-02-reporting/` |
| Epic 2 — submission confirmation | `/report-a-reef/confirmation` | `app/(observer)/report-a-reef/confirmation/page.tsx` | `features/epic-02-reporting/` |
| Epic 4 — location | `/report-a-reef/location` | `app/(observer)/report-a-reef/location/page.tsx` | `features/epic-04-location/` |
| Epic 5 — report queue | `/coordinator/report-queue` | `app/(coordinator)/coordinator/report-queue/page.tsx` | `features/epic-05-triage/` |
| Epic 5 — case review | `/coordinator/reports/[reportId]` | `app/(coordinator)/coordinator/reports/[reportId]/page.tsx` | `features/epic-05-triage/` |
| Epic 6 — report list | `/my-reports` | `app/(observer)/my-reports/page.tsx` | `features/epic-06-feedback/` |
| Epic 6 — status detail | `/my-reports/[reportId]` | `app/(observer)/my-reports/[reportId]/page.tsx` | `features/epic-06-feedback/` |

## Shared files: coordinate before editing

- `app/globals.css` — shared tokens, reset and global accessibility rules.
- `components/layout/` — application header, footer and page shell.
- `components/templates/` — common starting layout for content pages.
- `config/navigation.ts` — labels and destinations for each role.
- `lib/api/client.ts` — shared backend request helper.
- `features/shared/mock-app-state.tsx` — shared frontend-only case and location
  state used until backend integration begins.
- `package.json`, `next.config.ts` and `tsconfig.json` — project-wide configuration.

Do not create separate `.html` entry pages. A new browser page must be created as a `page.tsx` file inside the appropriate `app` route folder.

The Epic 1 and Epic 5 coordinator detail route is intentionally shared. Do not
replace it with an epic-specific version: the merged route checks ownership
first, then displays the claim, restricted-access or review workflow.
