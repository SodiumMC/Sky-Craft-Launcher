# Code Review — SCL 2.0.x

A pragmatic review of the codebase before open-sourcing. This is not a blocker list for 2.0.x;
it is a map of where the next maintenance effort should go.

## Snapshot

| Area | Value |
| --- | --- |
| Main process | `src/main/index.ts` (~1.8k lines) + `src/main/core/*` |
| Renderer | `src/renderer/src/App.tsx` (~2.8k lines), `HomeApp.tsx` (~350) |
| Styling | `styles.css` (~3.2k lines) |
| Type safety | strict TypeScript, `noUnusedLocals` / `noUnusedParameters` enabled |
| `any` | 1 occurrence |
| `console.log` in app code | 0 |
| Empty `catch` blocks | ~46 (mostly intentional best-effort cleanup) |
| Automated tests | none in CI (manual Playwright scripts historically) |

## Fixed in this pass

- Removed 19 unused imports, states, props and functions; enabled
  `noUnusedLocals` / `noUnusedParameters`.
- Archived ~120 one-off Playwright/debug scripts into `scripts/archive/`
  (git-ignored). The repository now keeps only build, update, and smoke scripts.
- Removed broken npm scripts that pointed at deleted files.
- Added a GitHub Actions workflow: `npm ci` → `typecheck` → `build`.
- Replaced all 12 native `<select>` controls with the custom `Select` component
  and fixed its double-border/focus-ring regression.
- Added rate limiting (5/min/IP) and field length caps to `POST /api/bug-report`.

## High priority

1. **Split `App.tsx`**. It owns every manager page, dialog and form. Suggested
   split: `pages/versions`, `pages/download`, `pages/settings`, `pages/logs`,
   `pages/saves`, `pages/servers`, `dialogs/account`, `dialogs/bug-report`,
   `dialogs/version-settings`. Keep `App.tsx` as routing + shared state only.
2. **Split `src/main/index.ts`**. Move IPC registrations into
   `src/main/ipc/{launch,install,content,config,update,bug}.ts`. The window
   lifecycle and state container can stay in `index.ts`.
3. **Replace the DOM-based i18n fallback** (`i18nAuto.ts`). It works and is
   audited, but mutating text nodes behind React is fragile. Long-term, move
   strings to the `t()` dictionary and drop the MutationObserver.
4. **Add automated tests**. At minimum: version JSON merge, `collectNatives`,
   argument expansion, path normalization, and a Playwright smoke test for
   launch + settings. CI currently only type-checks and builds.

## Medium priority

5. **Update transport security**. `checkForUpdate` and bug submission use
   `rejectUnauthorized: false` for the self-hosted HTTPS endpoint. Prefer a
   trusted certificate (Let's Encrypt) and remove the insecure flag.
6. **Update server auth**. `/api/bug-reports` is public unless `ADMIN_TOKEN` is
   set. Require the token by default in documentation and fail closed when it is
   configured incorrectly.
7. **`sandbox: false`**. `contextIsolation` and `nodeIntegration: false` are
   correct; enabling the renderer sandbox would need a preload audit.
8. **Empty catches**. Most are deliberate (cache cleanup, best-effort file
   removal). Convert the remaining ones to `catch (err) { log(...) }` where a
   failure would otherwise be invisible.
9. **CSS monolith**. `styles.css` mixes layout, themes and one-off components.
   Split into `base.css`, `components/`, `pages/`, `themes/`.
10. **Duplicated loader installers**. `installer.ts` and `forge.ts` repeat
    download/extract/meter logic. Extract a small `installer-common.ts`.

## Low priority

11. **Bundle size**. The renderer is a single chunk; route-level lazy loading
    would shorten startup.
12. **Config store**. `settings.json` writes are not atomic; write to a temp file
    and rename to avoid corruption on power loss.
13. **Error boundary**. A React error boundary around manager pages would avoid
    a blank window on renderer exceptions.
14. **Log buffer**. `logBuffer` is bounded in memory; verify the cap stays in
    place after future refactors.
15. **Dependency updates**. Electron/React majors are pinned; add Dependabot or
    Renovate once the release cadence stabilizes.

## Intentional decisions

- The launcher is a **single window**; dialogs resize the window instead of
  opening new ones. This is a product decision, not an architectural accident.
- Notifications are separate transparent windows by design.
- `i18nAuto.ts` is a transitional compatibility layer, not the target design.
- macOS builds are ad-hoc signed; proper distribution requires a Developer ID
  certificate and notarization.
