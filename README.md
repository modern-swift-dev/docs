# Modern Swift documentation

This repository builds and publishes the module documentation at
https://modern-swift-dev.github.io/docs/. Markdown, DocC catalogs, and website
sources remain in their module repositories. Generated HTML is deployed as a
GitHub Pages artifact and is never committed to Git.

The workflow runs daily at **07:23 UTC**, on pushes to `main`, and manually through
**Actions → Build and deploy documentation → Run workflow**. Pull requests build
and assemble the sites without deploying them. All module builds must succeed
before the complete site is deployed; a failed build leaves the live site intact.

## Initial setup

1. Merge the module migrations first: the builds must produce `.build/site` and
   use `/docs/<module>/` as their public base path. Remove the former module Pages
   workflows and tracked generated HTML. Keep all authored documentation.
2. Push this repository to its `main` branch.
3. In this repository's **Settings → Pages → Build and deployment**, select
   **GitHub Actions** as the source, then run the workflow.
4. Disable the former module Pages sites after the centralized site is verified.

The workflow checks out the public module repositories using read-only access;
no cross-repository publishing token is needed. It uses Xcode 26.6 on `macos-26`
and Node.js 22, matching the module build tools.

## Modules and local builds

The matrix in `.github/workflows/pages.yml` lists the ten modules and their build
commands. It follows `main`, except for `swift-markdown-ui`, which follows its
existing documentation branch, `develop`. `roundtrip-generator` currently has
only authored Markdown and no generated website.

Run a module's matrix build command in its checkout to generate `.build/site`.
To assemble sites locally, copy each result into this repository at
`.build/modules/site-<module>/`, then run:

```sh
python3 scripts/assemble.py
mkdir -p .build/preview/docs
cp -R .build/site/. .build/preview/docs/
python3 -m http.server 8000 --directory .build/preview
```

Open http://localhost:8000/docs/. The assembly creates a landing page linking to
each module and keeps every module's assets and DocC routes in its own directory.
Add new generated sites by adding a matrix entry with its source branch and build
command; assembly discovers the resulting artifacts automatically.

This migration prevents future generated commits. Existing Git history is not
rewritten.
