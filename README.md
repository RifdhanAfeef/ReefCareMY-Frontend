# ReefCare MY frontend skeleton

A shared Next.js App Router starter for the ReefCare MY frontend team. It provides the approved light visual theme, reusable navigation and footer, role-specific route groups, placeholder pages for the current Iteration 1 epics, and a shared API helper.

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

## Team rules

- Do not create standalone HTML pages. Use the existing Next.js App Router structure.
- Do not duplicate the header, footer or design tokens inside an epic.
- Do not change shared files, install packages or rename routes without team agreement.
- Do not place sensitive coordinates or role-restricted values in public UI, hidden HTML, mock logs or console output.
- Replace placeholder workspaces with the approved wireframe content while preserving professional headings and shared navigation.
- Run lint and the production build before handing work to integration.

Further contribution rules are in [`CONTRIBUTING.md`](CONTRIBUTING.md).
