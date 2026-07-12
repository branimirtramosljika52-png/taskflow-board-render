# SafeNexus Plan Editor - Milestone 1 Technical Spike Report

Date: 2026-07-12

## Scope

Milestone 1 was implemented as an isolated route at `/plan-editor/spike`. It is intentionally not the full editor. The spike covers:

- DWG/DXF upload entry point.
- MLightCAD runtime embedded behind `src/modules/plan-editor/adapters/mlightcadAdapter.js`.
- Local SafeNexus DXF adapter for the Milestone 1 subset: `LINE`, `LWPOLYLINE`, and classic `POLYLINE`.
- Layer list with show/hide toggles.
- Selection for `LINE` and `POLYLINE`.
- `LINE` grips: start, middle, end.
- Moving the end grip of a selected `LINE`.
- SafeNexus CAD JSON save, reload, and download.
- Basic vector PDF export for supported line/polyline entities.
- Unit tests and Playwright coverage, including a mobile-sized route smoke test for Android/WebView relevance.

## Files Added Or Changed

- `plan-editor-spike.html`
- `src/modules/plan-editor/core/safeNexusCadModel.js`
- `src/modules/plan-editor/adapters/dxfAdapter.js`
- `src/modules/plan-editor/adapters/mlightcadAdapter.js`
- `src/modules/plan-editor/export/cadPdfExport.js`
- `src/modules/plan-editor/ui/spikeApp.js`
- `src/modules/plan-editor/ui/spike.css`
- `test/planEditorCadModel.test.js`
- `e2e/plan-editor-spike.spec.js`
- `scripts/build.mjs`
- `server.js`
- `android-app/app/build.gradle.kts`
- `assets/mobile/SafeNexus-0.1.428.apk`
- `assets/mobile/SafeNexus.apk`
- `package.json`
- `package-lock.json`

## MLightCAD Integration

Sources reviewed:

- https://github.com/mlightcad/cad-viewer
- https://www.npmjs.com/package/@mlightcad/cad-simple-viewer
- Local npm package docs in `node_modules/@mlightcad/cad-simple-viewer/README.md`

The integrated package is `@mlightcad/cad-simple-viewer@1.5.7`. It is embedded only through an adapter so SafeNexus does not couple domain entities, storage, or PDF export directly to the MLight renderer.

MLight requires separate worker assets for:

- DXF parsing: `/assets/mlightcad/workers/dxf-parser-worker.js`
- DWG parsing: `/assets/mlightcad/workers/libredwg-parser-worker.js`
- MTEXT rendering: `/assets/mlightcad/workers/mtext-renderer-worker.js`

The build copies those worker files into `dist/assets/mlightcad/workers/`.

## What MLightCAD Already Supports

Based on package docs and inspected TypeScript declarations, `cad-simple-viewer` already provides:

- Browser CAD document manager via `AcApDocManager`.
- Canvas/WebGL rendering integration.
- File open flow through `openDocument(fileName, ArrayBuffer, options)`.
- Layer services and layer store.
- Entity service helpers.
- Command stack infrastructure.
- Selection set infrastructure.
- 2D view handling via `AcTrView2d`.
- Core commands such as open, zoom, pan, and select.
- Underlying data model classes for many AutoCAD-like entities, including line, polyline, circle, arc, text, mtext, block reference, hatch, dimensions, raster image, ray, and xline.
- Worker-based parsing path for DXF/DWG.

## What MLightCAD Does Not Solve For SafeNexus Yet

- It does not save edited drawings back to DWG/DXF, which is acceptable for this product because SafeNexus stores its own JSON.
- It does not provide the SafeNexus domain model, business links, audit/version storage, or zapisnik PDF insertion flow.
- It does not remove the need for our own CAD core. Selection, snapping, grips, transforms, symbols, history, storage, and PDF export must remain SafeNexus-owned.
- It does not remove licensing decisions for production DWG/DXF parsing.
- The package docs state its undo/redo tracking for direct modifications is still in progress.

## Entities Loaded In This Spike

SafeNexus JSON extraction supports the Milestone 1 subset:

- `LINE`
- `LWPOLYLINE`
- classic `POLYLINE` with `VERTEX` and `SEQEND`

The local DXF parser also imports layer table records from `TABLES/LAYER`.

The MLight runtime can render and model more entity types, but the adapter only extracts `LINE` and `POLYLINE` into SafeNexus JSON for this milestone.

## DWG/DXF Elements Lost In SafeNexus JSON M1

Known unsupported or intentionally dropped M1 entity types include:

- `CIRCLE`
- `ARC`
- `TEXT`
- `MTEXT`
- `INSERT` / blocks
- `HATCH`
- dimensions
- splines
- ellipses
- raster images
- xrefs
- proxy/custom entities
- polyline bulges and widths

Some of these may still render inside the MLight canvas when the parser supports them, but they are not persisted in the SafeNexus CAD JSON yet.

## SafeNexus CAD JSON

The spike writes structured JSON only. It does not store DOM, canvas bitmaps, or HTML.

The current model includes:

- project metadata and source file metadata
- layer records
- line/polyline entities
- style and source entity id fields
- page setup placeholder
- title block placeholder
- version and schema fields

Schema marker: `safe-nexus-cad`.

## PDF Export

The spike PDF export is implemented in `src/modules/plan-editor/export/cadPdfExport.js`.

It is a basic vector PDF:

- A4/A3 size support through page setup.
- Portrait/landscape support.
- Fit-to-page drawing bounds.
- Lines and polylines are drawn as vector line segments.
- Basic title/status text.

It is not the final professional export from Milestone 6. Title block, legend, logo, revision fields, scale control, and zapisnik integration remain future work.

## Performance Notes

- MLight uses a worker-based file open pipeline, which is appropriate for large CAD files.
- The LibreDWG worker copied into the app is large, about 12.8 MB before compression.
- SafeNexus M1 SVG rendering is suitable for the spike subset, but it is not the final renderer strategy for large drawings.
- For Milestone 2, SafeNexus should add spatial indexing before broadening hit testing and snapping to more entities.

## License Audit

Installed packages relevant to the spike:

| Package | Version | License | Risk |
| --- | ---: | --- | --- |
| `@mlightcad/cad-simple-viewer` | 1.5.7 | MIT | Viewer package is compatible. |
| `@mlightcad/data-model` | 1.10.3 | MIT | Compatible. |
| `@mlightcad/dxf-json-converter` | 1.10.3 | GPL-3.0 | Production blocker for closed-source distribution unless licensing is resolved. |
| `@mlightcad/libredwg-converter` | 3.10.3 | GPL-3.0 | Production blocker for closed-source DWG support unless licensing is resolved. |
| `@floating-ui/dom` | 1.0.0 | MIT | Added because `@tiptap/suggestion` already requires it. |

`npm audit --omit=dev --json` currently reports 10 vulnerabilities: 1 low, 3 moderate, and 6 high. One new relevant audit item is `lodash-es` through `@mlightcad/cad-simple-viewer`, with no npm fix currently available.

Recommendation: do not ship production DWG/DXF parsing with the current GPL parser chain inside a proprietary SafeNexus web bundle until legal/licensing is settled. Use this only as a spike, or replace the parser layer with a compatible commercial/proprietary parser while keeping the SafeNexus JSON model and adapter boundary.

## Verification

Commands run:

- `node --test test/planEditorCadModel.test.js`
- `npm run build`
- `npx playwright test plan-editor-spike.spec.js`
- `android-app/gradlew.bat :app:assembleDebug`

Results:

- CAD unit tests: 5 passed.
- Full Node test suite during build: 265 passed.
- Build: passed.
- Playwright spike tests: 3 passed, 1 mobile-only desktop-grip test intentionally skipped on mobile.
- Android debug APK build: passed.

Android/mobile coverage in this milestone:

- The route was tested in Playwright `mobile-chromium`.
- The spike layout is responsive and the DXF upload plus JSON save/reload flow passed in the mobile project.
- Native Android UI code was not changed in this milestone.
- Android package metadata was bumped to `0.1.428`, and the generated debug APK was copied to `assets/mobile/SafeNexus-0.1.428.apk` plus the current `assets/mobile/SafeNexus.apk`.

## Recommendation For Milestone 2

Proceed only after the DWG/DXF parser licensing decision is made.

Recommended Milestone 2 path:

- Keep `src/modules/plan-editor/core` independent from MLight and SafeNexus business modules.
- Replace or legally clear the parser layer before production deployment.
- Add a SafeNexus renderer abstraction before adding more entity types.
- Add spatial index and zoom-aware tolerance before implementing snapping.
- Implement core history early, before move/copy/delete tools spread through the UI.
- Extend JSON entities to text, circle, arc, dimensions, and symbols only after M1 line/polyline behavior is stable.
- Keep Android checks in every milestone using mobile viewport and, when native shell code changes, a fresh APK build.
