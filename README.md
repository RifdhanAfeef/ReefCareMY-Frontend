# ReefCare MY frontend

This is the Next.js frontend for ReefCare MY. It lets reef observers learn what
to report, submit an observation and follow its status. It also contains the
coordinator and administrator workspaces used in the Iteration 1 prototype.

## Run the project

You need Node.js 20.9 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.
Then open `http://localhost:3000`.

## Useful commands

```bash
npm run dev        # start the development server
npm run check      # run linting, TypeScript checks and tests
npm run build      # create a production build
npm run start      # run the production build
```

## Project structure

- `app/` contains routes and page layouts.
- `features/` contains the components and logic for each epic.
- `components/` contains shared layout, navigation and form components.
- `config/navigation.ts` contains navigation labels and destinations.
- `lib/api/` contains the typed backend request functions.
- `docs/` contains team guidance and backend integration notes.

Folders in parentheses organise routes without changing the URL. For example,
`app/(observer)/my-reports/page.tsx` is available at `/my-reports`.

## Backend connection

Authentication, reference data, Dive Sessions, report submission and observer
report tracking are connected to the FastAPI backend. Observer My Reports is
paginated, so it is not limited to the first 20 records.

The coordinator queue can display claimed and unclaimed reports, owners and
statuses. The current backend queue endpoint still returns only unclaimed
reports, so the backend contract must be expanded before claimed cases can stay
visible there. Claim, owned-case detail, information request, supported response
decisions and closure calls are connected. “My Cases” can reopen reports claimed
through the current browser by verifying each saved reference with the existing
owned-case detail endpoint. A complete cross-device list still needs a backend
owned-cases endpoint. Administrator actions remain preview-only because their
backend endpoints have not been defined.

Unsubmitted report and location drafts are stored in the browser, while draft
photographs use IndexedDB. Administrator preview records also use local storage
until an administrator API exists. The backend remains responsible for
authentication, permissions, private evidence, exact locations and permanent
records.

Current account roles are:

- `observer` — Registered Observer
- `case_coordinator` — Case Coordinator
- `system_administrator` — System Administrator

An unauthenticated visitor is not an account role.

See `docs/BACKEND_INTEGRATION_READINESS.md` for the remaining integration work.

## Testing notes

- Run `npm run check` and `npm run build` before sharing a change.
- Open a route directly in the browser when it is not linked in the navigation.
- Clear Local Storage and IndexedDB to restore the original prototype data.
- Dates are shown as `dd/mm/yyyy` and converted to ISO format at the API boundary.

## Team guidelines

- Add pages through the Next.js App Router instead of standalone HTML files.
- Reuse the shared header, footer, templates and design tokens.
- Keep mock records inside the relevant feature folder.
- Never place sensitive coordinates or restricted data in public UI or logs.
- Agree with the team before adding packages, renaming routes or changing shared files.

More contribution guidance is available in `CONTRIBUTING.md`.
