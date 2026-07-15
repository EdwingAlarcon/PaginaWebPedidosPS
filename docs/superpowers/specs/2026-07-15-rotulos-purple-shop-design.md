# PurpleShop Shipping Labels App Design

## Context

PurpleShop currently manages orders in a static HTML/CSS/JavaScript app. The new requirement is a modern web app for generating, customizing, saving, downloading, and printing professional shipping labels sized exactly 14 cm wide by 11 cm high.

The existing order app must remain intact. The label app will be added as a separate Next.js application inside this repository.

## Goals

- Create a production-ready label generator for daily store operations.
- Preserve the existing order app and avoid risky migration work.
- Generate labels with PurpleShop branding, logo, Instagram QR, sender and recipient data.
- Save labels, customers, settings, and automatic order-number state in Supabase.
- Produce PDFs and print output that match the live preview and respect the exact 14 cm x 11 cm size.
- Support configurable automatic order numbering with uniqueness guarantees.

## Non-Goals

- Replacing the existing order-management app.
- Migrating Microsoft Graph or OneDrive order sync into Next.js.
- Building multi-user roles beyond storing an optional creator identifier.
- Building multiple label templates in the first version. The first version ships one polished default template and a configuration field for the default template.

## Architecture

The repository will contain:

- Existing static app at the repository root.
- New Next.js app at `apps/rotulos`.
- Supabase SQL migrations under `apps/rotulos/supabase/migrations`.
- Shared label rendering components inside the Next.js app so preview, print, and PDF use the same source of truth.

The root app will include a visible navigation entry to open the labels app. In local development the labels app runs on its own port. In production, it can be deployed independently to Vercel.

## Technology Choices

- Next.js App Router with TypeScript strict mode.
- Tailwind CSS for UI and print styling.
- Supabase for persistence.
- Server route for PDF generation.
- Browser print support using print-specific CSS and exact physical dimensions.

If Supabase environment variables are missing during local development, the UI should still load and clearly report that persistence is unavailable. Core data operations can use an in-memory/local fallback only for development convenience, but production instructions will require Supabase.

## Primary Screens

### Dashboard

The dashboard is the first screen and focuses on store operations:

- Total labels generated.
- Labels generated today.
- Latest labels.
- Primary action: "Crear rotulo".
- Quick access to history and settings.

### Create Label

The create screen contains a form and a live preview.

Sender block:

- Nombre / Empresa
- Telefono
- Departamento
- Ciudad
- Direccion

Recipient block:

- Nombre y apellidos
- Telefono
- Departamento
- Ciudad
- Direccion completa
- Barrio / sector
- Referencia o indicaciones
- Observaciones

Additional order data:

- Numero de pedido
- Fecha
- Transportadora
- Metodo de pago: pagado or contraentrega
- Valor contraentrega
- Cantidad de paquetes

The order number is generated automatically when opening a new label draft. The next sequence is not committed until the user saves the label.

### Preview

The preview must render the real label layout:

- Exact visual size: 14 cm x 11 cm.
- Horizontal orientation.
- Purple header.
- Visible PurpleShop logo.
- Visible and scannable Instagram QR.
- Instagram username: configurable, default `@PURPLESHOP.ONLINE`.
- Brand phrase: configurable.
- Two-column sender/recipient area.
- Recipient receives stronger visual priority.
- Large address area with controlled wrapping.
- High-contrast lines suitable for thermal or ink printing.

The design is operational, not decorative. The main UI is quiet and efficient; the label itself carries the PurpleShop identity.

### PDF and Print

The app exposes:

- "Descargar PDF"
- "Imprimir"

PDF requirements:

- Page size exactly 14 cm x 11 cm.
- Controlled margins.
- No cropped text.
- QR preserved.
- Logo aspect ratio preserved.
- Output visually matches the live preview.

Print requirements:

- Print stylesheet sets physical page size to 14 cm x 11 cm.
- The label is centered/aligned for printing.
- Non-label UI is hidden in print.

### History

The history screen includes:

- Cliente
- Telefono
- Ciudad
- Fecha
- Numero de pedido
- Estado
- Search by order number and customer.
- Actions: print, download PDF, duplicate, edit, delete.

Duplicating a label creates a new draft with the same customer and shipment data but a new automatically generated order number unless the user manually overrides it and manual edits are enabled.

### Settings

Settings include:

- Default sender.
- PurpleShop logo URL or uploaded asset reference.
- Official Instagram QR URL or uploaded asset reference.
- Instagram username.
- Brand colors.
- Brand phrase.
- Label size.
- Default template.
- Order-number configuration.

## Order Numbering

Default format:

`PS-{YEAR}-{SEQUENCE}`

Example:

`PS-2026-000001`

Configurable fields:

- Prefix.
- Optional suffix.
- Initial sequence.
- Sequence digit count.
- Separator.
- Include year, month, or full date.
- Date format: `YYYY`, `YYYYMM`, `YYYYMMDD`.
- Reset policy: never, daily, monthly, annually.
- Allow manual order-number edits.
- Dynamic format string.

Supported variables:

- `{PREFIX}`
- `{SUFFIX}`
- `{YEAR}`
- `{MONTH}`
- `{DAY}`
- `{DATE}`
- `{SEQUENCE}`
- `{CITY}`
- `{DEPARTMENT}`

Rules:

- Every saved label must have a unique order number.
- Manual edits, when enabled, must validate uniqueness before save.
- The next number preview in settings is estimated and does not commit sequence state.
- Sequence state commits only when saving a label.
- Sequence generation must be database-backed to avoid collisions.

## Data Model

### `customers`

- `id`
- `full_name`
- `phone`
- `department`
- `city`
- `address`
- `neighborhood`
- `created_at`
- `updated_at`

### `labels`

- `id`
- `order_number`
- `sender`
- `recipient`
- `shipment`
- `payment_method`
- `cod_amount`
- `package_count`
- `carrier`
- `status`
- `pdf_url`
- `created_by`
- `created_at`
- `updated_at`

The sender, recipient, and shipment data may be stored as `jsonb` in the first version to keep the form flexible while preserving the full label payload.

### `settings`

- `id`
- `default_sender`
- `logo_url`
- `qr_url`
- `instagram_user`
- `brand_phrase`
- `brand_colors`
- `label_size`
- `default_template`
- `order_number_config`
- `created_at`
- `updated_at`

### `order_sequences`

- `id`
- `scope_key`
- `current_value`
- `reset_policy`
- `updated_at`

`scope_key` represents the active reset bucket, such as `never`, `2026`, `202607`, or `20260715`.

## Supabase Security

All exposed public tables must have RLS enabled.

Initial policy options:

- Single-store private app: authenticated users can manage all rows.
- Public local-only demo: no production access without authenticated policies.

The first production-ready migration should prefer authenticated access and avoid exposing service-role keys to the browser.

## Components

- `LabelShell`: app layout, navigation, and responsive frame.
- `DashboardStats`: dashboard metrics.
- `LabelForm`: create/edit form.
- `SenderFields`: sender field group.
- `RecipientFields`: recipient field group.
- `ShipmentFields`: order and delivery metadata.
- `LabelPreview`: exact visual label renderer.
- `LabelActions`: save, PDF, print, duplicate.
- `HistoryTable`: searchable label history.
- `SettingsForm`: store, brand, and numbering configuration.
- `OrderNumberPreview`: renders next estimated order number.

## Data Flow

1. App loads settings.
2. Create screen requests an estimated next order number for preview.
3. User fills or edits label data.
4. Live preview updates from form state.
5. Save action validates fields and order-number uniqueness.
6. If automatic numbering is active, the server confirms the next sequence inside a database operation.
7. Label is inserted.
8. History and dashboard refresh.
9. PDF and print use the saved label payload and same label preview component styles.

## Validation

Required fields:

- Sender name, phone, department, city, address.
- Recipient name, phone, department, city, full address.
- Date.
- Carrier.
- Payment method.
- Package count.
- Unique order number.

Conditional fields:

- `cod_amount` is required when payment method is `contraentrega`.

UI validation must show clear field-level messages.

## Error Handling

- Missing Supabase configuration: show a clear banner and disable save actions.
- Duplicate order number: show a specific error and keep the draft intact.
- PDF generation failure: keep the label saved and show retry guidance.
- QR/logo load failure: show a visible placeholder in preview and block final verification until fixed.

## Visual Direction

The app UI is utilitarian and professional for repeated daily use. The label itself is the branded artifact.

Palette:

- Purple primary: `#6B1FA2`
- Purple dark: `#3B0A57`
- Purple light: `#B57EDC`
- White: `#FFFFFF`
- Gray light: `#F5F5F7`
- Black: `#111111`

Signature element:

- A precise label canvas with a purple top band, strong recipient block, and QR/Instagram stamp. This makes the preview feel like the final printed object, not a mockup.

## Verification Plan

Before final delivery:

- Verify QR appears in preview.
- Verify QR appears in PDF.
- Verify PDF page size is 14 cm x 11 cm.
- Verify all fields render.
- Verify recipient address wraps without being cut.
- Verify logo keeps aspect ratio.
- Verify layout is usable on mobile.
- Verify print CSS hides non-label UI.
- Verify history can duplicate and reuse labels.
- Verify manual order-number duplicate validation.
- Verify automatic order-number format `PS-{YEAR}-{SEQUENCE}`.

## Deployment

Local development:

- `cd apps/rotulos`
- install dependencies
- configure `.env.local`
- run migrations
- start Next.js dev server

Production:

- Deploy `apps/rotulos` to Vercel.
- Configure Supabase environment variables in Vercel.
- Apply Supabase migrations.
- Validate PDF generation in the deployed environment.

