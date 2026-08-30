# Landing page

This folder contains the completed public landing page. The route file is
`app/(public)/page.tsx` and the reusable content is in `landing-page.tsx`.

The page introduces ReefCare MY, links to public responsible-reporting
guidance, explains the observer journey, identifies the four supported threat
categories and explains sensitive-location protection. It deliberately does
not include a public report feed, public report tracking or any suggestion that
an unauthenticated visitor is a stored account role.

Unauthenticated visitors can learn and register. Report creation links through
login, while the real backend must protect submission and My Reports.

The four threat cards deep-link to their selected content on `/learn` using the
documented threat code. The landing hero uses the approved reef photograph in
`public/images/landing/`.

Keep the shared header and footer in `components/layout/`; do not copy them into this feature folder.
