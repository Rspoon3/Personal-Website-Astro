---
name: add-app
description: Add a new app to this personal website — app-list card, optional details landing page, and privacy policy. Use when the user wants to add/list a new app, app entry, project, or App Store listing to the site (often pointing at a sibling iOS project folder for the images and copy).
---

# Add a new app to the site

This site lists apps from `src/json/apps.json`, rendered as cards by
`src/components/AppSection.astro` on the home page. Each app can also have a
details landing page (`/<slug>`) and a privacy policy (`/<slug>/privacy`).

Use this skill to add a new app with full parity to the existing ones.

## 1. Gather inputs

Ask the user for anything missing. iOS app projects usually keep this material
in their repo (e.g. `AppStoreConnect*.txt`, `README.md`, `Features.md`, an
`Images/` folder, and `Scripts/AppIcon/` or `Assets.xcassets/AppIcon.appiconset`).

- **Title** and **tagline** (one short line)
- **App Store ID** (`appId`) — digits only, e.g. `6784174120`. Without it there's
  no App Store link or smart-banner; confirm with the user how the card should
  behave (link to details page, App Store, or no link).
- **Short description** (1–2 sentences) and **long description** (a paragraph) —
  the App Store Connect promotional text / description are good sources.
- **App icon** — prefer a 1024×1024 square PNG.
- **Promo banner** — the home-page card image. Standard size is **2048×1366**
  (the de-facto banner size across the site).
- **Hero image** (only if building a details page) — a framed device screenshot
  (portrait) reads best; it renders at ~400px wide.

Pick a **slug** in kebab-case (e.g. `fit-card`). It's used for the image folder,
the route, and the apps.json `slug`.

## 2. Copy images into `src/images/<slug>/`

```
mkdir -p src/images/<slug>
cp <icon-source>.png    src/images/<slug>/appIcon.png
cp <banner-source>.png  src/images/<slug>/device_promo_banner.png
# only if building a details page:
cp <framed-screenshot>.png src/images/<slug>/heroImage.png
```

Verify dimensions with `sips -g pixelWidth -g pixelHeight <file>`.

## 3. Add the entry to `src/json/apps.json`

Insert at the **top** of the array — the list is newest-first.

**Gotcha:** the two image paths use different prefixes (this is intentional —
`AppSection.astro` resolves `heroImage` through an `import.meta.glob` keyed on
`../images/**`, while `icon` is a public-style path):

- `icon`     → `/images/<slug>/appIcon.png`
- `heroImage` → `../images/<slug>/device_promo_banner.png`

Set `slug` to `/<slug>` if you're building a details page (the card links there,
and the page holds the App Store button — this is how Momentum works). If there's
no details page, set `slug` to the App Store URL
(`https://apps.apple.com/us/app/id<appId>`).

```json
{
  "title": "<Title>",
  "tagline": "<Tagline>",
  "icon": "/images/<slug>/appIcon.png",
  "slug": "/<slug>",
  "appId": "<appId>",
  "heroImage": "../images/<slug>/device_promo_banner.png",
  "shortDescription": "<short>",
  "description": "<long>"
}
```

Validate the JSON: `node -e "JSON.parse(require('fs').readFileSync('src/json/apps.json','utf8'))"`.

## 4. (Optional) Details page — `src/pages/<slug>/index.astro`

Model it on `src/pages/momentum/index.astro`. It composes shared components:
`AppHead`, `Header`, `HeroSection`, `IconGrid`, `LandingPageFooter`. Look the app
up by title from `apps.json` and build `appLink` from `appId`.

The `IconGrid` items use the **Bootstrap Icons** set via `astro-icon` (`bi:` prefix,
e.g. `bi:heart-pulse`). The grid is 3-up on desktop; 3 or 6 items both look good.

**Verify icon names exist before using them** (a bad name fails the build):

```
node -e "const j=require('@iconify-json/bi/icons.json'); ['heart-pulse','share-fill'].forEach(n=>console.log(n, n in j.icons))"
```

Template:

```astro
---
import AppHead from "../../components/AppHead.astro";
import Header from "../../components/Header.astro";
import HeroSection from "../../components/HeroSection.astro";
import IconGrid from "../../components/IconGrid.astro";
import LandingPageFooter from "../../components/LandingPageFooter.astro";

import heroImage from "../../images/<slug>/heroImage.png";
import appIcon from "../../images/<slug>/appIcon.png";
import downloadOnAppStoreBlack from "../../images/misc/download-on-app-store-black.svg";
import apps from "../../json/apps.json";

const app = apps.find((a) => a.title === "<Title>");
const appLink = app.appId ? `https://apps.apple.com/us/app/id${app.appId}` : null;

const iconGridItems = [
  { icon: "bi:heart-pulse", title: "<Feature>", description: "<...>" },
  // 3 or 6 items
];
---

<html lang="en">
  <AppHead title="<Title>" appId={app.appId} />
  <body class="text-white" style="background-color: #1a1a1a;">
    <Header title={app.title} appIcon={appIcon} appLink={appLink} detailsPageLink="/<slug>" />
    <HeroSection
      heroImage={heroImage}
      appIcon={appIcon}
      title="<Title>"
      tagline="<Tagline>"
      appLink={appLink}
      downloadButton={downloadOnAppStoreBlack}
    />
    <IconGrid items={iconGridItems} />
    <LandingPageFooter bgColor="#0a0a0a" />
  </body>
</html>
```

## 5. (Optional) Privacy policy — `src/pages/<slug>/privacy.md`

Every app on the site has one; it's the URL given to App Store Connect. Model it
on `src/pages/momentum/privacy.md`. Tailor the data-collection sections to what
the app actually does (don't copy Momentum's claims verbatim). Frontmatter:

```md
---
title: "<Title> Privacy Policy"
layout: "../../layouts/MarkdownLayout.astro"
---
```

End with a `**<Month Day, Year>:** First Published` line.

## 6. Verify

- `npm run build` — must complete clean (catches bad image imports, JSON, and
  unknown `bi:` icons).
- `npm run dev -- --port 3000`, then check the home page, `/<slug>`, and
  `/<slug>/privacy` (e.g. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/<slug>`).

The production URLs are `https://rspoon3.com/<slug>` and
`https://rspoon3.com/<slug>/privacy`.

## Notes

- `offer-codes.astro` (see `photo-ranker`) is app-specific and only needed when an
  app distributes App Store promo/offer codes — skip it otherwise.
- Apps are not registered anywhere else — `apps.json` plus the page files are all
  that's needed.
