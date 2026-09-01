# ReefCare MY frontend — Iteration 1


## Deployed Frontend Link:

https://reefcare-frontend.vercel.app/

## Start locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` in a browser.

## Main commands

```bash
npm run dev     # start local development
npm run lint    # check code quality
npm run typecheck # check TypeScript without producing files
npm run test    # run acceptance and API-contract tests
npm run check   # lint, typecheck and test
npm run build   # confirm the production build works
npm run start   # run the completed production build
```

## Where teammates should work

- Browser pages belong in `app/` as `page.tsx` files.
- Epic-specific components, hooks and types belong in the matching `features/epic-*` folder.
- Shared layout components belong in `components/layout/`.
- Shared page patterns belong in `components/templates/`.
- Navigation labels and route destinations belong in `config/navigation.ts`.
- Backend request helpers belong in `lib/api/`.

See [`docs/FOLDER_ASSIGNMENTS.md`](docs/FOLDER_ASSIGNMENTS.md) for the exact route and file assigned to every Iteration 1 page.

## Route groups

Folders such as `(public)`, `(observer)`, `(coordinator)` and `(admin)` organise the code by user view. Parentheses mean the folder name does not appear in the URL. For example:

- `app/(observer)/my-reports/page.tsx` becomes `/my-reports`.
- `app/(coordinator)/coordinator/report-queue/page.tsx` becomes `/coordinator/report-queue`.

These layouts demonstrate the navigation expected for each role. Actual security must also be enforced by authentication, server-side authorisation and the backend API.

## Integration status

Authentication, reference data, Dive Sessions, report submission and observer
tracking use the FastAPI API. Coordinator and administrator screens retain
prototype state until the remaining backend contracts are finalised. API adapters for every documented
endpoint are in `lib/api/`; known backend-owned blockers and the integration order
are recorded in [`docs/BACKEND_INTEGRATION_READINESS.md`](docs/BACKEND_INTEGRATION_READINESS.md).

Case claims, review outcomes and the current location draft are currently saved
in browser `localStorage`. Epic 2 photograph files use IndexedDB because browser
files cannot be stored safely as JSON in `localStorage`.

- Keep mock records in the relevant `features/epic-*/` folder rather than inside page files.
- Keep interface types close to the documented backend contract to reduce later rework.
- Replace mock data with functions in `lib/api/` during integration; do not rewrite the page layouts.
- Use `features/shared/mock-app-state.tsx` for cross-page prototype state. Do not
  create a second case or location store inside an epic.

An unregistered visitor is an unauthenticated application state, not a stored
user role. Iteration 1 registered accounts use these backend role codes:

- `observer` — displayed as **Registered Observer**
- `case_coordinator` — displayed as **Case Coordinator**
- `system_administrator` — displayed as **System Administrator**

## Testing a page

A Next.js page can be tested even when it is not connected to the landing page or navigation. Start the development server with npm run dev or npm.cmd run dev, then enter the page’s route directly in the browser.

For example:
app/(observer)/report-a-reef/location/page.tsx

can be opened at:
http://localhost:3000/report-a-reef/location

Folders in parentheses, such as (observer), organise the project but are not included in the URL. The filename page.tsx is also omitted.
If a file is only a reusable component inside features/ or components/, it will not have its own URL. Import the component into an appropriate page.tsx file before testing it.


## Team rules

- Do not create standalone HTML pages. Use the existing Next.js App Router structure.
- Do not duplicate the header, footer or design tokens inside an epic.
- Do not change shared files, install packages or rename routes without team agreement.
- Do not place sensitive coordinates or role-restricted values in public UI, hidden HTML, mock logs or console output.
- Replace placeholder workspaces with the approved wireframe content while preserving professional headings and shared navigation.
- Run lint and the production build before handing work to integration.

Further contribution rules are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Implemented Iteration 1 areas

- Public landing page: project purpose, supported threats, reporting journey,
  location privacy and appropriate login/registration entry points.
- Epic 1: administrator roles/access, coordinator ownership and restricted case access.
- Epic 2: public threat guidance, validated observation capture, local drafts,
  review, submission confirmation and handoff to the coordinator queue.
- Epic 4: Dive Session selection/creation, named-site baseline, optional pin,
  location confidence and privacy review.
- Epic 5: report queue, claim flow, evidence assessment, information requests,
  response selection and compatible fixed closure reasons.

Login and registration are connected. Observer, coordinator and administrator
route groups are gated by role for navigation/privacy; FastAPI must still enforce
authorisation on every protected endpoint.

To restore the original demonstration data while testing, clear this site's
storage (both Local Storage and IndexedDB) in browser developer tools and
refresh the page.

The latest FastAPI report contract uses camelCase frontend fields such as
`threatCategoryId`, `observedAt`, `diveSessionId`, `namedDiveSiteId` and
`locationConfidence`. Integration-ready types are recorded in
`lib/api/types.ts`. The pure payload builder is in
`features/epic-02-reporting/report-payload.ts`.

All visible frontend dates use `dd/mm/yyyy`. Report and Dive Session forms use
the shared date control, which accepts typed `dd/mm/yyyy` values and also opens
the browser's calendar picker. The visible value stays independent of the
browser or operating-system locale and is converted to the backend's ISO value
at the API boundary.

Standard content pages receive the shared back button from
`components/templates/page-template.tsx`. Epic-specific full-page workflows use
the reusable `components/navigation/back-button.tsx` component alongside their
own step-level Back and Cancel controls.
