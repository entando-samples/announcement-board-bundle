# Micro frontend descriptor and runtime contract (row 28)

Reference: https://developer.entando.com/v7.5/docs/curate/bundle-details.html#micro-frontends-specifications

## Descriptor entries (`entando.json` → `microfrontends[]`)

| Field | board | manager | board-config |
|---|---|---|---|
| `name` / custom element | `announcement-board` | `announcement-manager` | `announcement-board-config` |
| `stack` | `react` | `react` | `react` |
| `type` | `widget` | `widget` | `widget-config` |
| `group` | `free` | `free` | `free` |
| `titles` | en/it | en/it | – |
| `buildFolder` | `dist` (Vite) | `dist` | `dist` |
| `apiClaims` | `announcement-api` (step 13) | `announcement-api` (step 13) | – |
| `contextParams` | `page_code`, `info_currentLang` (step 15) | – | – |
| `params` / `configMfe` | step 18 | – | – |

The CLI defaults `buildFolder` to `build` (Create React App); Vite emits
`dist`, so the field is mandatory.

## Runtime `config` object

The platform sets the `config` attribute to a JSON string with this shape.
Locally, `public/mfe-config.json` provides the same object.

| Path | Type | Source |
|---|---|---|
| `systemParams.api["announcement-api"].url` | string | API claim (`ent bundle api add`) |
| `params.<name>` | string | Widget configuration saved by App Builder |
| `contextParams.<name>` | string | Page context (`contextParams` in the descriptor) |

All values are strings: numbers and booleans must be parsed and validated.

The `widget-config` MFE uses a different contract: App Builder sets and reads
its `config` **property** (not attribute) holding a flat `{name: value}` object.

## Build output

Vite library mode, UMD format, one `<name>.js` and one `<name>.css` in `dist/`.
`process.env.NODE_ENV` is defined at build time (React reads it).

## Styling

No global selectors. Board: shadow DOM (step 16). Manager: every rule nested
under the `.announcement-manager` class.
