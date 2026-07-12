# SafeNexus Plan Editor Milestone 2 Report

Date: 2026-07-12

## Summary

Milestone 2 adds an independent SafeNexus CAD Core and a production `/plan-editor` route that works on SafeNexus CAD JSON instead of MLightCAD internals. The production editor can open supported DXF files, draw and edit core CAD entities, use snap/ortho/grid behavior, undo/redo commands, save/reload JSON locally, and export a vector PDF.

The old `/plan-editor/spike` route remains source-available, but default production builds mark it development-only and do not ship GPL parser assets.

## Implemented

- CAD Import Layer with `CadImportAdapter`, `SafeNexusDxfImportAdapter`, disabled `DwgImportAdapter`, and placeholders for image/PDF import.
- SafeNexus CAD Core entities: `line`, `polyline`, `circle`, `arc`, `text`.
- Entity methods for bounds, grip points, snap points, translate, rotate, clone, and JSON serialization.
- Geometry helpers for distance, projection, intersection, bounding boxes, angle, ortho, polar, and grid snap.
- Spatial index with insert, update, remove, viewport query, and cursor radius query.
- Selection manager with click selection, box/crossing selection, add/remove modifiers, and locked-layer protection.
- Grip editing for line, polyline, circle, arc, and text basics.
- Zoom-aware snap engine for endpoint, midpoint, center, intersection, nearest, and grid.
- Grid rendering inside SVG without generating a DOM node per grid crossing.
- Tool lifecycle-ready UI tools: Select, Pan, Line, Polyline, Circle, Arc, Text, Move, Copy, Delete.
- Command history for add, delete, move/copy, line grip edits, polyline vertex edits, and property changes.
- SafeNexus CAD JSON v2 serialization, migration, and validation with a JSON Schema record.
- Autosave debounce of 3 seconds after completed commands.
- Vector PDF export for line, polyline, circle, arc, and text.
- Mobile smoke behavior with guidance that CAD editing is best on desktop/tablet.

## Production Parser Boundary

The production frontend does not bundle MLightCAD/LibreDWG parser components. Default `dist` output was checked and did not contain:

- `libredwg`
- `dxf-parser`
- `mlightcad`
- `cadview-dwg`
- `plan-editor-spike.js`

Details are documented in `docs/cad-parser-license-decision.md`.

## Tests

Passed:

- `npm test` - 276 passing Node tests.
- `npm run build` - completed successfully.
- `npm run test:e2e` - 10 passing, 8 skipped. Skips are intentional for development-only spike and desktop-only CAD edit flows on mobile.
- Android `:app:assembleDebug` - completed successfully for SafeNexus `0.1.429`.

New CAD coverage includes:

- point projection
- line midpoint
- line bounds
- line grip movement
- polyline bounds
- segment midpoint
- circle snap points
- line intersection
- ortho constraint
- polar constraint
- grid snap
- snap priority
- spatial index query
- JSON round-trip
- history undo/redo
- one grip drag as one undo command
- DXF import for LINE/POLYLINE/CIRCLE/ARC/TEXT
- vector PDF export without raster image XObjects
- Playwright draw/snap/grip/ortho/undo/redo/save/reload/PDF flow

## Known Limitations

- Persistence is local browser storage in Milestone 2; backend project storage/versioning is still future work.
- DXF import supports a practical subset: LINE, LWPOLYLINE/POLYLINE, CIRCLE, ARC, and TEXT.
- DWG import is intentionally disabled until a licensed backend-only parser is selected.
- TEXT editing is basic: content and height are editable; rich MTEXT is not implemented.
- ARC hit-testing and bounds are sufficient for current tests but need more precision for complex wrapped arcs.
- Selection and grips are usable, but not yet full AutoCAD parity.
- PDF export is vector-based but does not include Milestone 6 title block, legend, logo, or final print setup UX.
- The command bar, domain symbols, gas isometry, AI import, Trim, Extend, and Offset are intentionally not implemented in Milestone 2.

## Android

The Android debug APK was rebuilt and copied to:

- `assets/mobile/SafeNexus-0.1.429.apk`
- `assets/mobile/SafeNexus.apk`

The production build also copies both files into `dist/assets/mobile/`.

## Recommendation For Milestone 3

Keep the CAD Core stable and add domain symbols through a separate symbols/domain layer, not directly into the renderer. Backend storage should be introduced before deeper domain workflows so plans can link cleanly to company, location, work order, and report records.
