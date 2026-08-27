# Contributing to the ReefCare MY frontend

1. Pull the latest shared branch before starting.
2. Confirm the assigned route in `docs/FOLDER_ASSIGNMENTS.md`.
3. Build page-specific UI in the matching `features/epic-*` folder and keep the route's `page.tsx` focused on composing that UI.
4. Reuse the application shell and shared tokens. Do not copy the header or footer into an epic folder.
5. Keep API calls in `lib/api` or an agreed feature service file. Do not hard-code backend URLs in components.
6. Ask the team before installing a dependency or changing shared configuration, navigation, tokens or route names.
7. Run `npm run lint` and `npm run build` before requesting integration.

The route-group layouts are a frontend demonstration of role-specific views. They do not replace backend authentication and authorisation checks.
