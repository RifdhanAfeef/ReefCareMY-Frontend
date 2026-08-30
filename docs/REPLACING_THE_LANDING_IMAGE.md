# Replacing the landing-page illustration with a photograph

The current diver illustration remains in place until the team selects a reef
photograph with permission to use it.

## Recommended image

- Landscape photograph, approximately 1600 × 1100 pixels.
- JPG or WebP, ideally below 500 KB after optimisation.
- A genuine reef-observation or diver-documentation scene.
- No recognisable person without consent and no sensitive location metadata.
- Record the photographer, source and licence in the project documentation.

## Add the file

Save the selected image as:

```text
public/images/reefcare-hero.jpg
```

Files inside `public/` are addressed from the website root, so that file is
available to Next.js as `/images/reefcare-hero.jpg`.

## Update the landing component

In `features/landing/landing-page.tsx`, import Next.js Image:

```tsx
import Image from "next/image";
```

Replace `<ReefIllustration />` inside `visualPanel` with:

```tsx
<Image
  className={styles.heroPhoto}
  src="/images/reefcare-hero.jpg"
  alt="A diver documenting a coral reef"
  width={1600}
  height={1100}
  priority
/>
```

Then add this class to `features/landing/landing-page.module.css`:

```css
.heroPhoto {
  width: 100%;
  aspect-ratio: 16 / 11;
  display: block;
  object-fit: cover;
  border-radius: 32px;
  box-shadow: 0 28px 50px rgba(20, 54, 66, 0.14);
}
```

Do not use a remote image URL unless its host is intentionally configured in
`next.config.ts`. A local file keeps development and deployment predictable.
