# SafeNexus CAD Parser License Decision

Date: 2026-07-12

This document is a technical record for SafeNexus Plan Editor parser usage. It is not legal advice.

## Decision

The production `/plan-editor` route must not ship GPL DWG/DXF parser components to the browser.

Milestone 2 keeps the old `/plan-editor/spike` source available as a development-only route, but the default production build writes a disabled spike page and does not emit the spike JavaScript bundle or MLightCAD worker files.

DWG import remains disabled by default:

```text
CAD_DWG_IMPORT_ENABLED=false
```

## Parser Components

| Component | Where It Executes | Transmitted To User | License/Risk | Production Decision | Replacement Path |
| --- | --- | --- | --- | --- | --- |
| `src/modules/plan-editor/adapters/dxfAdapter.js` | SafeNexus import layer; usable from Node/backend and currently used by the browser editor for DXF text | Yes, as SafeNexus-authored source in `plan-editor.js` | SafeNexus code, no GPL dependency | Allowed | Extend subset parser or move behind backend API when persistence is added |
| `SafeNexusDxfImportAdapter` | SafeNexus CAD Import Layer | Yes when bundled by `/plan-editor` | SafeNexus code | Allowed | Keep as production DXF adapter |
| `DwgImportAdapter` | Isolated adapter only | Yes as small SafeNexus wrapper, no DWG parser included | No parser code included; disabled feature flag | Allowed wrapper only | Backend-only licensed DWG conversion service |
| `@mlightcad/dxf-json-converter` | Spike source only; not in production `package.json` | No in default production build | GPL-family risk if shipped in browser | Removed from production dependency tree | SafeNexus DXF adapter or backend parser |
| `@mlightcad/libredwg-converter` | Spike source only; not in production `package.json` | No in default production build | LibreDWG/GPL risk if shipped in browser | Removed from production dependency tree | Backend-only licensed DWG parser |
| `libredwg-parser-worker.js` | MLightCAD worker | No in default production build | GPL parser delivered to user would be high risk | Excluded unless `SAFE_NEXUS_BUILD_CAD_SPIKE=true` | Backend-only conversion |
| `@cadview/dwg` / `libredwg.js` / `libredwg.wasm` | Legacy vendor asset path | No in default production build | GPL/LibreDWG delivery risk | Excluded unless `SAFE_NEXUS_BUILD_LEGACY_GPL_CAD=true` | Backend-only conversion |

## Build Controls

Default production build:

- Builds `/assets/plan-editor.js` from SafeNexus CAD Core and UI.
- Copies `/plan-editor.html` and `/assets/plan-editor.css`.
- Does not build `/assets/plan-editor-spike.js`.
- Does not copy `libredwg-parser-worker.js`.
- Does not copy `cadview-dwg.js`, `libredwg.js`, or `libredwg.wasm`.

Development-only flags:

```text
SAFE_NEXUS_BUILD_CAD_SPIKE=true
SAFE_NEXUS_BUILD_LEGACY_GPL_CAD=true
```

These flags are intentionally separate so the spike and legacy GPL DWG assets are never included by accident in the normal production bundle.

The MLightCAD spike source remains in the repository for historical analysis, but the MLightCAD packages are not part of the normal dependency tree. A developer who intentionally re-enables the spike must install those packages locally and build with the explicit spike flag.

## Current Audit

After the default build, the `dist` directory was checked for:

```text
libredwg
dxf-parser
dwg
mlightcad
cadview-dwg
plan-editor-spike.js
```

No matching production files were emitted.

## Recommendation

For production DWG, add a backend-only conversion service after legal review. The browser should receive only SafeNexus CAD JSON. The SafeNexus CAD Core must remain independent of parser source, so DWG, DXF, image, PDF, AI analysis, and blank drawings all normalize into the same SafeNexus CAD JSON model.
