# The Shala – Class Planner

Web app for creating and organising yoga class plans from a fixed template
(the two-page "Class Planner" spread). Plans are stored locally in the browser
and can be printed as a two-page A4 spread.

## Stack

- Vue 3 + TypeScript + Vite
- Pinia (state), Vue Router (pages)
- Dexie over IndexedDB (storage, versioned)
- vite-plugin-pwa (installable, works offline)
- Netlify (hosting, deploy previews)

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ locally
```

## Deploy to Netlify

1. Create a GitHub repository and push this project.
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick the repo.
   Build settings are read from `netlify.toml`, so accept the defaults.
3. Under **Site configuration → Build & deploy → Deploy contexts**, keep
   *Deploy previews* enabled. Every pull request then gets its own preview URL.
4. Optionally set a custom domain under **Domain management**.

The production URL must never change once the user starts entering real plans:
browser storage is tied to the exact origin. Share only the production URL with
the user, and use preview URLs only for feedback on unfinished work.

## Data and backwards compatibility

Every stored record (plan, template) carries a `schemaVersion`. On startup the
app compares that with `CURRENT_SCHEMA_VERSION` in `src/data/types.ts` and runs
forward-only migration steps from `src/data/migrations.ts`. A snapshot of the raw
data is written to the `backups` table before any migration or import.

When you change the shape of a plan or template:

1. Bump `CURRENT_SCHEMA_VERSION` in `src/data/types.ts`.
2. Add a step in `src/data/migrations.ts` keyed by the version you migrate *from*.
   Give new fields a default there. Never rename or repurpose an existing field.
3. Only bump Dexie's `version()` in `src/data/db.ts` if you add or change an
   index, and keep every earlier `version()` call in place.

Users can export and import all data as JSON from the Backup page.

## Project layout

```
src/
  data/        types, migrations, Dexie database, export/import, default template
  stores/      Pinia store for plans and templates
  views/       Plan list, plan editor, print view, template editor, backup page
  components/  Small shared pieces
  style.css    Screen and print styles
```
