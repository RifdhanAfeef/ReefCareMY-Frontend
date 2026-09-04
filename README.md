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
report tracking are connected to the FastAPI backend. Some coordinator and
administrator actions still use prototype data while the remaining backend
endpoints are completed.

Temporary prototype data is stored in the browser. Normal records use
`localStorage`, while draft photographs use IndexedDB. The backend must remain
responsible for authentication, permissions, private evidence, exact locations
and permanent storage.

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
