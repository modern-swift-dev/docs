# Modern Swift documentation

One Astro application owns the website at
https://modern-swift-dev.github.io/docs/. The root page and every module guide
share Calder's theme, layout, navigation, typography, and components in this
repository. API references retain Apple's DocC interface.

Module repositories own their Markdown guides in `Documentation/Site/`, DocC
catalogs under `Sources/`, and example Swift files. They have no Astro application,
website dependencies, or theme. Generated HTML is never committed to Git.

## Build and preview locally

Requirements: Node.js 22.18 or newer, npm, and Xcode 26.6 with its command-line
tools selected. Keep this checkout beside the module checkouts:

```text
modern-swift-dev/
  docs/
  calder-swiftui/
  lockbox-swift/
  ...
```

From this repository:

```sh
npm ci
npm run build:api
npm run build
npm run preview
```

Open http://127.0.0.1:8000/docs/. `build:api` generates all DocC references under
`.build/api/`. `build` prepares module content, type-checks and builds the shared
Astro app, assembles the site into `.build/site/`, and checks its local links.
After a guide or theme edit, rerun `npm run build`; unchanged API references can
be reused. Rebuild one module's API with `npm run build:api -- swift-stash`.

Set `DOCS_SOURCES_ROOT` to the absolute parent directory of module checkouts when
using another layout. CI checks out modules into `.build/sources/<module>`.
Preparation fetches current stable releases only for guides using release tokens.
If no GitHub Release exists, it uses the highest stable `X.Y.Z` or `vX.Y.Z` tag,
links to that tag, and shows “Published via Git tag” without inventing a release date.
`GITHUB_TOKEN` or `GH_TOKEN` can authenticate those reads; without a token, public
GitHub API rate limits apply. Other API failures or a missing stable tag stop the build.

## Writing module guides

Keep each guide in the module at `Documentation/Site/<route>/index.md`. The
module overview is `Documentation/Site/index.md`. For example,
`Documentation/Site/documentation/getting-started/index.md` renders at
`/docs/<module>/documentation/getting-started/`.

Every page requires YAML frontmatter:

```md
---
title: "Getting started"
description: "Install the library and build your first example."
---

# Getting started
```

Use normal Markdown for headings, tables, links, and fenced code. Existing
explicit HTML anchor IDs remain supported. Site links start with
`/docs/<module>/`.

The central content preparation step expands `{{version}}` (without a leading
`v`), `{{releaseDate}}`, `{{releaseURL}}`, and `{{releaseNotes}}` from the latest
stable GitHub release. To include a Swift example directly from its source, put
a standalone marker in the guide:

```md
<!-- include: Examples/MyExample/Sources/MyExample/main.swift -->
```

The path is relative to the module checkout. Preparation renders the current
Swift file as a code block. An included `.md` file is rendered as Markdown,
allowing an existing tutorial such as `docs/api-generation.md` to remain the
canonical source. Includes are expanded once; nested include markers are not
processed. Preparation never edits module Markdown.

## Website ownership

- `astro.config.mjs`, `package.json`, and `package-lock.json`: the sole Astro setup.
- `src/styles/global.css`: Calder's shared theme and documentation styles.
- `src/layouts/BaseLayout.astro`: shared header, footer, and page frame.
- `src/pages/index.astro`: the themed root page and module directory.
- `src/pages/[module]/[...page].astro`: shared guide layout and navigation.
- `src/data/modules.ts`: typed registry of modules, source branches, and API targets.
- `scripts/`: content preparation, DocC generation, assembly, preview, and validation.

The registry follows `main`, except MarkdownUI's existing `develop` branch.
RoundTrip Generator includes its API generation tutorial and all nine library
API references. Existing
module guide URLs and DocC URLs are preserved, including MarkdownUI's merged
references and Pathways' authored API overview. Assembly copies DocC first,
then overlays the shared Astro pages at their intentional landing routes.

## Publishing

The GitHub Actions workflow runs daily at **07:23 UTC**, on pushes to `main`, and
manually through **Actions → Build and deploy documentation → Run workflow**.
Pull requests validate the whole site without deploying it.

The workflow reads the module registry, prepares Markdown and generates DocC
independently for each module, then builds Astro **once** in this repository.
Only a successful complete build deploys. It uses the standard read-only
`GITHUB_TOKEN` for source/release reads; no cross-repository publishing credential
is needed. The deployment job alone has Pages write permission.

For this migration, publish the module Markdown changes before the central
workflow changes. GitHub Pages must use **GitHub Actions** as its source in the
`docs` repository settings. Generated pages are uploaded as short-lived build
artifacts and deployed without creating generated commits. Existing Git history
is not rewritten.
