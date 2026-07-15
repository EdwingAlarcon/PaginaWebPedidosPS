# Task 5 Report: Label Preview and Form

## Status

Implemented Task 5 in the `rotulos-purple-shop` worktree. The `/crear` placeholder is replaced with an operational label creator. The `/historial` and `/configuracion` placeholder pages were not changed.

## Delivered

- Added `LabelPreview` with a `data-testid="label-canvas"` physical-label surface.
- Added fixed label CSS with `width: 14cm` and `height: 11cm`.
- Added sender, recipient, shipment, estimated order number, and action components.
- Added `LabelForm`, which initializes a configured order number, mirrors form input into the preview, validates the draft on save, and offers browser printing.
- Added the real `/crear` route content while retaining the existing app shell and dashboard styles.
- Added print CSS that hides all document content except `.print-area` and sets `@page` to `14cm 11cm` with no margin.
- Added preview coverage in `label-preview.test.tsx` for the label canvas, order number, sender, recipient, and QR alt text.

## Test-First Evidence

1. Added the preview test before `LabelPreview` existed.
2. Ran `npm --prefix apps/rotulos run test -- label-preview`.
3. Confirmed the intended red failure: Vite could not resolve `@/components/label-preview`.
4. Added the requested implementation.
5. The supplied `getByText("PurpleShop")` assertion was ambiguous because the required UI displays that string in both the brand header and sender block. It was changed to `getAllByText("PurpleShop")` with an expected count of two, preserving coverage for both visible occurrences.
6. Re-ran the targeted test and confirmed it passed.

## Verification

Fresh commands completed successfully:

```powershell
npm --prefix apps/rotulos run test -- label-preview
# 1 test passed

npm --prefix apps/rotulos run typecheck
# completed with exit code 0

npm --prefix apps/rotulos run test
# 4 test files passed, 15 tests passed

npm --prefix apps/rotulos run build
# Next.js production build completed successfully
```

Browser verification on `http://localhost:3001/crear` confirmed:

- The page renders in the app shell and replaces the old placeholder.
- The label has a 1.273 width-to-height ratio, matching 14:11.
- Both logo and QR images use `object-fit: contain` and expose visible alt text: `Logo PurpleShop` and `QR de Instagram PurpleShop`.
- Editing `Nombre y apellidos` to `Laura Gomez` updates the recipient label preview immediately.
- Exactly one label canvas is contained by `.print-area`.

## Self-Review

- `git diff --check` reported no whitespace errors.
- The label canvas uses the exact requested centimetre dimensions in both screen and print CSS.
- The `@media print` rules hide non-label UI and expose only `.print-area`.
- No SVG or decorative orb elements were introduced.
- The creator remains responsive: form and preview stack below 1100px while preserving the physical-label aspect ratio.

## Concern

`defaultSettings` pre-configures `/purple-shop-logo.png` and `/purple-shop-qr.png`, but `apps/rotulos/public` does not exist in this worktree. Browser requests for those two URLs return 404, so their specified alt text is visible until the assets are provided. This is pre-existing configuration/assets work outside the Task 5 file list; no unrelated asset changes were made.
