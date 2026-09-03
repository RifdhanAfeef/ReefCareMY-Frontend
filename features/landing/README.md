# Landing page

The public home page introduces ReefCare MY, explains the reporting journey and
links visitors to guidance, registration and login. Its route is `/`, with the
main component in `landing-page.tsx`.

The four threat cards link directly to the matching section of `/learn`. The
page does not show public reports, report tracking or sensitive locations.

The journey steps and threat cards appear gradually as they enter the screen.
Cards also lift on hover or keyboard focus, their icons grow slightly and their
arrows move to the right. Visitors who prefer reduced motion see the content
without these effects.

When the page first loads, the hero text and actions enter in a short sequence
while the reef image settles into place from the right.

The shared header remains visible while scrolling and uses a lightly
transparent, blurred background. Header and footer changes belong in
`components/layout/`, not in this feature folder.

The hero and threat sections use a connected, softly distorted caustic mesh
over a near-white background to resemble sunlight moving through shallow water.
The lines use a light teal detail stroke with a subtle diffuse edge. This
background motion is also disabled when the visitor prefers reduced motion.
