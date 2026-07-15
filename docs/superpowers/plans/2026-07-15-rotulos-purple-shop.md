# PurpleShop Shipping Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate Next.js app at `apps/rotulos` for creating, saving, previewing, printing, and downloading PurpleShop shipping labels with configurable automatic order numbering.

**Architecture:** Keep the existing static order app intact. Add a new Next.js App Router application with feature-organized code under `apps/rotulos/src`, Supabase migrations under `apps/rotulos/supabase/migrations`, and shared label rendering code used by preview, print, and PDF generation. The root app only receives a navigation entry to the new labels app.

**Tech Stack:** Next.js App Router, TypeScript strict mode, Tailwind CSS, Supabase, Playwright-based server PDF generation, Vitest, Testing Library, Playwright E2E.

## Global Constraints

- Existing static app at repository root must remain intact.
- New app path is `apps/rotulos`.
- Label physical size is exactly `14cm x 11cm`.
- Default order-number format is `PS-{YEAR}-{SEQUENCE}`.
- Default generated order number example is `PS-2026-000001`.
- Supabase public tables must have RLS enabled.
- Service-role or secret keys must never be exposed to browser code.
- PDF and print output must preserve QR, logo, all fields, and exact size.
- UI must be operational, responsive, professional, and PurpleShop-branded.
- The first version ships one polished default label template.

---

## File Structure

Create and modify these files:

- Create `apps/rotulos/package.json`: app-specific scripts and pinned dependencies.
- Create `apps/rotulos/next.config.ts`: Next.js config.
- Create `apps/rotulos/tsconfig.json`: strict TypeScript config.
- Create `apps/rotulos/postcss.config.mjs`: Tailwind PostCSS config.
- Create `apps/rotulos/tailwind.config.ts`: PurpleShop theme tokens.
- Create `apps/rotulos/eslint.config.mjs`: lint config.
- Create `apps/rotulos/vitest.config.ts`: unit test config.
- Create `apps/rotulos/playwright.config.ts`: E2E config.
- Create `apps/rotulos/.env.example`: Supabase env template.
- Create `apps/rotulos/README.md`: install, develop, Supabase, deploy, and verification instructions.
- Create `apps/rotulos/src/app/layout.tsx`: app shell and metadata.
- Create `apps/rotulos/src/app/page.tsx`: dashboard route.
- Create `apps/rotulos/src/app/crear/page.tsx`: create/edit label route.
- Create `apps/rotulos/src/app/historial/page.tsx`: history route.
- Create `apps/rotulos/src/app/configuracion/page.tsx`: settings route.
- Create `apps/rotulos/src/app/api/labels/[id]/pdf/route.ts`: server PDF download route.
- Create `apps/rotulos/src/app/globals.css`: app, label, and print CSS.
- Create `apps/rotulos/src/components/app-shell.tsx`: navigation frame.
- Create `apps/rotulos/src/components/dashboard-stats.tsx`: metrics and latest labels.
- Create `apps/rotulos/src/components/label-form.tsx`: create/edit form controller.
- Create `apps/rotulos/src/components/sender-fields.tsx`: sender fields.
- Create `apps/rotulos/src/components/recipient-fields.tsx`: recipient fields.
- Create `apps/rotulos/src/components/shipment-fields.tsx`: shipment/payment/order fields.
- Create `apps/rotulos/src/components/label-preview.tsx`: exact printable label.
- Create `apps/rotulos/src/components/label-actions.tsx`: save, print, PDF actions.
- Create `apps/rotulos/src/components/history-table.tsx`: history search and row actions.
- Create `apps/rotulos/src/components/settings-form.tsx`: default sender, brand, numbering config.
- Create `apps/rotulos/src/components/order-number-preview.tsx`: next number preview.
- Create `apps/rotulos/src/lib/types.ts`: domain types.
- Create `apps/rotulos/src/lib/defaults.ts`: default settings and blank label draft.
- Create `apps/rotulos/src/lib/order-number.ts`: order-number formatting and scope logic.
- Create `apps/rotulos/src/lib/validation.ts`: form validation.
- Create `apps/rotulos/src/lib/label-store.ts`: data-access interface and local fallback.
- Create `apps/rotulos/src/lib/supabase/client.ts`: browser Supabase client.
- Create `apps/rotulos/src/lib/supabase/server.ts`: server Supabase client.
- Create `apps/rotulos/src/lib/pdf.ts`: HTML rendering helper for PDF route.
- Create `apps/rotulos/src/lib/format.ts`: currency, dates, text helpers.
- Create `apps/rotulos/src/__tests__/order-number.test.ts`: numbering tests.
- Create `apps/rotulos/src/__tests__/validation.test.ts`: validation tests.
- Create `apps/rotulos/src/__tests__/label-preview.test.tsx`: preview rendering tests.
- Create `apps/rotulos/e2e/rotulos.spec.ts`: browser flow and visual checks.
- Create `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`: tables, RLS, RPC.
- Modify `package.json`: add convenience scripts for `rotulos:*`.
- Modify `index.html`: add a visible "Rotulos de envio" entry to root app navigation.

---

### Task 1: Scaffold the Next.js App

**Files:**
- Create: `apps/rotulos/package.json`
- Create: `apps/rotulos/next.config.ts`
- Create: `apps/rotulos/tsconfig.json`
- Create: `apps/rotulos/postcss.config.mjs`
- Create: `apps/rotulos/tailwind.config.ts`
- Create: `apps/rotulos/eslint.config.mjs`
- Create: `apps/rotulos/vitest.config.ts`
- Create: `apps/rotulos/playwright.config.ts`
- Create: `apps/rotulos/.env.example`
- Create: `apps/rotulos/src/app/layout.tsx`
- Create: `apps/rotulos/src/app/page.tsx`
- Create: `apps/rotulos/src/app/globals.css`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm --prefix apps/rotulos run dev`, `build`, `typecheck`, `test`, and `test:e2e` scripts.
- Produces: root scripts `rotulos:dev`, `rotulos:build`, `rotulos:test`, `rotulos:e2e`.

- [ ] **Step 1: Create app package and config files**

Create `apps/rotulos/package.json`:

```json
{
  "name": "@purpleshop/rotulos",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  },
  "dependencies": {
    "@supabase/ssr": "0.12.3",
    "@supabase/supabase-js": "2.110.6",
    "clsx": "2.1.1",
    "lucide-react": "1.24.0",
    "next": "16.2.10",
    "playwright": "1.61.1",
    "qrcode": "1.5.4",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "26.1.1",
    "@types/qrcode": "1.5.6",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.3",
    "eslint": "10.7.0",
    "eslint-config-next": "16.2.10",
    "jsdom": "29.1.1",
    "autoprefixer": "10.5.3",
    "postcss": "8.5.19",
    "tailwindcss": "3.4.19",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

Create `apps/rotulos/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Create `apps/rotulos/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `apps/rotulos/postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

Create `apps/rotulos/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purpleShop: {
          DEFAULT: "#6B1FA2",
          dark: "#3B0A57",
          light: "#B57EDC",
          paper: "#F5F5F7",
          ink: "#111111",
        },
      },
      boxShadow: {
        label: "0 18px 50px rgba(17, 17, 17, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
```

Create `apps/rotulos/eslint.config.mjs`:

```js
import next from "eslint-config-next";

export default [...next];
```

Create `apps/rotulos/vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

Create `apps/rotulos/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ],
});
```

Create `apps/rotulos/.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROTULOS_BASE_URL=http://localhost:3001
```

- [ ] **Step 2: Create first App Router files**

Create `apps/rotulos/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PurpleShop Rotulos",
  description: "Generador de rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/rotulos/src/app/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-purpleShop-paper p-6 text-purpleShop-ink">
      <h1 className="text-3xl font-semibold">Rotulos PurpleShop</h1>
      <p className="mt-2 text-sm text-neutral-600">Generador profesional de rotulos de envio.</p>
    </main>
  );
}
```

Create `apps/rotulos/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f5f7;
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 3: Add root convenience scripts**

Modify root `package.json` scripts:

```json
{
  "scripts": {
    "start": "python -m http.server 8000",
    "serve": "npx http-server -p 8000",
    "rotulos:dev": "npm --prefix apps/rotulos run dev",
    "rotulos:build": "npm --prefix apps/rotulos run build",
    "rotulos:test": "npm --prefix apps/rotulos run test",
    "rotulos:e2e": "npm --prefix apps/rotulos run test:e2e"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run:

```powershell
npm install --prefix apps/rotulos
```

Expected: `apps/rotulos/package-lock.json` is created and dependencies install without errors.

- [ ] **Step 5: Verify scaffold**

Run:

```powershell
npm --prefix apps/rotulos run typecheck
npm --prefix apps/rotulos run build
```

Expected: both commands exit with code 0.

- [ ] **Step 6: Commit**

```powershell
git add package.json apps/rotulos
git commit -m "feat(rotulos): scaffold Next app"
```

---

### Task 2: Add Domain Types, Defaults, Numbering, and Validation

**Files:**
- Create: `apps/rotulos/src/lib/types.ts`
- Create: `apps/rotulos/src/lib/defaults.ts`
- Create: `apps/rotulos/src/lib/order-number.ts`
- Create: `apps/rotulos/src/lib/validation.ts`
- Create: `apps/rotulos/src/lib/format.ts`
- Create: `apps/rotulos/src/test/setup.ts`
- Create: `apps/rotulos/src/__tests__/order-number.test.ts`
- Create: `apps/rotulos/src/__tests__/validation.test.ts`

**Interfaces:**
- Produces: `formatOrderNumber(config, context): string`
- Produces: `getSequenceScope(resetPolicy, date): string`
- Produces: `validateLabelDraft(draft): ValidationResult`
- Produces: `defaultSettings`, `createBlankLabelDraft()`

- [ ] **Step 1: Write numbering tests**

Create `apps/rotulos/src/__tests__/order-number.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultOrderNumberConfig } from "@/lib/defaults";
import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";

describe("order numbering", () => {
  it("formats the PurpleShop default number", () => {
    expect(
      formatOrderNumber(defaultOrderNumberConfig, {
        date: new Date("2026-07-15T12:00:00Z"),
        sequence: 1,
        city: "Bogota",
        department: "Cundinamarca",
      }),
    ).toBe("PS-2026-000001");
  });

  it("supports date and four-digit sequence formats", () => {
    expect(
      formatOrderNumber(
        {
          ...defaultOrderNumberConfig,
          pattern: "{PREFIX}-{DATE}-{SEQUENCE}",
          sequenceDigits: 4,
          dateFormat: "YYYYMMDD",
        },
        {
          date: new Date("2026-07-15T12:00:00Z"),
          sequence: 23,
          city: "Cali",
          department: "Valle",
        },
      ),
    ).toBe("PS-20260715-0023");
  });

  it("normalizes city and suffix variables", () => {
    expect(
      formatOrderNumber(
        {
          ...defaultOrderNumberConfig,
          suffix: "ONLINE",
          pattern: "{PREFIX}-{CITY}-{SEQUENCE}-{SUFFIX}",
          sequenceDigits: 6,
        },
        {
          date: new Date("2026-07-15T12:00:00Z"),
          sequence: 245,
          city: "Bogota D.C.",
          department: "Cundinamarca",
        },
      ),
    ).toBe("PS-BOGOTA-000245-ONLINE");
  });

  it("returns scope keys for reset policies", () => {
    const date = new Date("2026-07-15T12:00:00Z");
    expect(getSequenceScope("never", date)).toBe("never");
    expect(getSequenceScope("annual", date)).toBe("2026");
    expect(getSequenceScope("monthly", date)).toBe("202607");
    expect(getSequenceScope("daily", date)).toBe("20260715");
  });
});
```

- [ ] **Step 2: Write validation tests**

Create `apps/rotulos/src/__tests__/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import { validateLabelDraft } from "@/lib/validation";

describe("label validation", () => {
  it("accepts a complete paid label", () => {
    const draft = createBlankLabelDraft();
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Calle 1 # 2-3",
    };
    draft.recipient = {
      fullName: "Ana Perez",
      phone: "3101234567",
      department: "Antioquia",
      city: "Medellin",
      address: "Carrera 45 # 10-20",
      neighborhood: "Laureles",
      reference: "Porteria principal",
      notes: "",
    };
    draft.orderNumber = "PS-2026-000001";
    draft.carrier = "Servientrega";
    draft.paymentMethod = "pagado";
    draft.packageCount = 1;

    expect(validateLabelDraft(draft)).toEqual({ valid: true, errors: {} });
  });

  it("requires contraentrega amount for COD labels", () => {
    const draft = createBlankLabelDraft();
    draft.sender.name = "PurpleShop";
    draft.sender.phone = "3001234567";
    draft.sender.department = "Cundinamarca";
    draft.sender.city = "Bogota";
    draft.sender.address = "Calle 1 # 2-3";
    draft.recipient.fullName = "Ana Perez";
    draft.recipient.phone = "3101234567";
    draft.recipient.department = "Antioquia";
    draft.recipient.city = "Medellin";
    draft.recipient.address = "Carrera 45 # 10-20";
    draft.orderNumber = "PS-2026-000001";
    draft.carrier = "Interrapidisimo";
    draft.paymentMethod = "contraentrega";
    draft.codAmount = 0;

    const result = validateLabelDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.codAmount).toBe("Ingresa el valor contraentrega.");
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
npm --prefix apps/rotulos run test
```

Expected: FAIL because `@/lib/defaults`, `@/lib/order-number`, and `@/lib/validation` do not exist.

- [ ] **Step 4: Implement types and defaults**

Create `apps/rotulos/src/lib/types.ts`:

```ts
export type PaymentMethod = "pagado" | "contraentrega";
export type LabelStatus = "borrador" | "generado" | "impreso" | "anulado";
export type ResetPolicy = "never" | "daily" | "monthly" | "annual";
export type DateFormat = "YYYY" | "YYYYMM" | "YYYYMMDD";

export type Sender = {
  name: string;
  phone: string;
  department: string;
  city: string;
  address: string;
};

export type Recipient = {
  fullName: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  reference: string;
  notes: string;
};

export type OrderNumberConfig = {
  prefix: string;
  suffix: string;
  initialSequence: number;
  sequenceDigits: number;
  separator: "-" | "/" | ".";
  dateFormat: DateFormat;
  resetPolicy: ResetPolicy;
  allowManualEdit: boolean;
  pattern: string;
};

export type BrandColors = {
  primary: string;
  dark: string;
  light: string;
  paper: string;
  ink: string;
};

export type LabelSettings = {
  defaultSender: Sender;
  logoUrl: string;
  qrUrl: string;
  instagramUser: string;
  brandPhrase: string;
  brandColors: BrandColors;
  labelSize: { widthCm: number; heightCm: number };
  defaultTemplate: "purpleshop-classic";
  orderNumberConfig: OrderNumberConfig;
};

export type LabelDraft = {
  id?: string;
  orderNumber: string;
  date: string;
  sender: Sender;
  recipient: Recipient;
  carrier: string;
  paymentMethod: PaymentMethod;
  codAmount: number;
  packageCount: number;
  status: LabelStatus;
};

export type LabelRecord = LabelDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl: string | null;
  createdBy: string | null;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};
```

Create `apps/rotulos/src/lib/defaults.ts`:

```ts
import type { LabelDraft, LabelSettings, OrderNumberConfig } from "@/lib/types";

export const defaultOrderNumberConfig: OrderNumberConfig = {
  prefix: "PS",
  suffix: "",
  initialSequence: 1,
  sequenceDigits: 6,
  separator: "-",
  dateFormat: "YYYY",
  resetPolicy: "annual",
  allowManualEdit: true,
  pattern: "{PREFIX}-{YEAR}-{SEQUENCE}",
};

export const defaultSettings: LabelSettings = {
  defaultSender: {
    name: "PurpleShop",
    phone: "",
    department: "",
    city: "",
    address: "",
  },
  logoUrl: "/purple-shop-logo.png",
  qrUrl: "/purple-shop-qr.png",
  instagramUser: "@PURPLESHOP.ONLINE",
  brandPhrase: "Detalles que viajan con amor",
  brandColors: {
    primary: "#6B1FA2",
    dark: "#3B0A57",
    light: "#B57EDC",
    paper: "#F5F5F7",
    ink: "#111111",
  },
  labelSize: { widthCm: 14, heightCm: 11 },
  defaultTemplate: "purpleshop-classic",
  orderNumberConfig: defaultOrderNumberConfig,
};

export function createBlankLabelDraft(): LabelDraft {
  return {
    orderNumber: "",
    date: new Date().toISOString().slice(0, 10),
    sender: { ...defaultSettings.defaultSender },
    recipient: {
      fullName: "",
      phone: "",
      department: "",
      city: "",
      address: "",
      neighborhood: "",
      reference: "",
      notes: "",
    },
    carrier: "",
    paymentMethod: "pagado",
    codAmount: 0,
    packageCount: 1,
    status: "borrador",
  };
}
```

- [ ] **Step 5: Implement numbering, validation, and formatting**

Create `apps/rotulos/src/lib/order-number.ts`:

```ts
import type { OrderNumberConfig, ResetPolicy } from "@/lib/types";

type NumberContext = {
  date: Date;
  sequence: number;
  city: string;
  department: string;
};

function pad(value: number, digits: number): string {
  return String(value).padStart(digits, "0");
}

function cleanToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function datePart(date: Date, part: "year" | "month" | "day"): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  if (part === "year") return year;
  if (part === "month") return month;
  return day;
}

export function formatDateToken(date: Date, format: OrderNumberConfig["dateFormat"]): string {
  const year = datePart(date, "year");
  const month = datePart(date, "month");
  const day = datePart(date, "day");
  if (format === "YYYY") return year;
  if (format === "YYYYMM") return `${year}${month}`;
  return `${year}${month}${day}`;
}

export function formatOrderNumber(config: OrderNumberConfig, context: NumberContext): string {
  const year = datePart(context.date, "year");
  const month = datePart(context.date, "month");
  const day = datePart(context.date, "day");
  const replacements: Record<string, string> = {
    PREFIX: cleanToken(config.prefix),
    SUFFIX: cleanToken(config.suffix),
    YEAR: year,
    MONTH: month,
    DAY: day,
    DATE: formatDateToken(context.date, config.dateFormat),
    SEQUENCE: pad(context.sequence, config.sequenceDigits),
    CITY: cleanToken(context.city),
    DEPARTMENT: cleanToken(context.department),
  };

  return config.pattern.replace(/\{([A-Z]+)\}/g, (_match, token: string) => replacements[token] ?? "");
}

export function getSequenceScope(resetPolicy: ResetPolicy, date: Date): string {
  const year = datePart(date, "year");
  const month = datePart(date, "month");
  const day = datePart(date, "day");
  if (resetPolicy === "never") return "never";
  if (resetPolicy === "annual") return year;
  if (resetPolicy === "monthly") return `${year}${month}`;
  return `${year}${month}${day}`;
}
```

Create `apps/rotulos/src/lib/validation.ts`:

```ts
import type { LabelDraft, ValidationResult } from "@/lib/types";

function requireText(errors: Record<string, string>, key: string, value: string, message: string): void {
  if (!value.trim()) errors[key] = message;
}

export function validateLabelDraft(draft: LabelDraft): ValidationResult {
  const errors: Record<string, string> = {};

  requireText(errors, "sender.name", draft.sender.name, "Ingresa el nombre del remitente.");
  requireText(errors, "sender.phone", draft.sender.phone, "Ingresa el telefono del remitente.");
  requireText(errors, "sender.department", draft.sender.department, "Ingresa el departamento del remitente.");
  requireText(errors, "sender.city", draft.sender.city, "Ingresa la ciudad del remitente.");
  requireText(errors, "sender.address", draft.sender.address, "Ingresa la direccion del remitente.");
  requireText(errors, "recipient.fullName", draft.recipient.fullName, "Ingresa el nombre del destinatario.");
  requireText(errors, "recipient.phone", draft.recipient.phone, "Ingresa el telefono del destinatario.");
  requireText(errors, "recipient.department", draft.recipient.department, "Ingresa el departamento del destinatario.");
  requireText(errors, "recipient.city", draft.recipient.city, "Ingresa la ciudad del destinatario.");
  requireText(errors, "recipient.address", draft.recipient.address, "Ingresa la direccion del destinatario.");
  requireText(errors, "orderNumber", draft.orderNumber, "Ingresa el numero de pedido.");
  requireText(errors, "date", draft.date, "Ingresa la fecha.");
  requireText(errors, "carrier", draft.carrier, "Ingresa la transportadora.");

  if (!Number.isInteger(draft.packageCount) || draft.packageCount < 1) {
    errors.packageCount = "Ingresa al menos un paquete.";
  }

  if (draft.paymentMethod === "contraentrega" && draft.codAmount <= 0) {
    errors.codAmount = "Ingresa el valor contraentrega.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

Create `apps/rotulos/src/lib/format.ts`:

```ts
export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}
```

Create `apps/rotulos/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Run tests and typecheck**

Run:

```powershell
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run typecheck
```

Expected: PASS and typecheck exits with code 0.

- [ ] **Step 7: Commit**

```powershell
git add apps/rotulos/src/lib apps/rotulos/src/test apps/rotulos/src/__tests__
git commit -m "feat(rotulos): add label domain model"
```

---

### Task 3: Add Supabase Schema, RLS, and Sequence RPC

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`
- Create: `apps/rotulos/src/lib/supabase/client.ts`
- Create: `apps/rotulos/src/lib/supabase/server.ts`
- Create: `apps/rotulos/src/lib/label-store.ts`

**Interfaces:**
- Produces: SQL function `public.reserve_order_number(p_label_date date, p_city text, p_department text, p_manual_order_number text default null) returns text`.
- Produces: `getLabelStore(): LabelStore`.
- Produces: `LabelStore` methods: `listLabels`, `getLabel`, `saveLabel`, `deleteLabel`, `duplicateLabel`, `getSettings`, `saveSettings`, `estimateNextOrderNumber`.

- [ ] **Step 1: Create migration**

Create `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  department text not null default '',
  city text not null default '',
  address text not null default '',
  neighborhood text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  default_sender jsonb not null,
  logo_url text not null default '/purple-shop-logo.png',
  qr_url text not null default '/purple-shop-qr.png',
  instagram_user text not null default '@PURPLESHOP.ONLINE',
  brand_phrase text not null default 'Detalles que viajan con amor',
  brand_colors jsonb not null,
  label_size jsonb not null default '{"widthCm":14,"heightCm":11}'::jsonb,
  default_template text not null default 'purpleshop-classic',
  order_number_config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_sequences (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null unique,
  current_value bigint not null default 0,
  reset_policy text not null default 'annual',
  updated_at timestamptz not null default now()
);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  sender jsonb not null,
  recipient jsonb not null,
  shipment jsonb not null,
  payment_method text not null check (payment_method in ('pagado', 'contraentrega')),
  cod_amount numeric not null default 0,
  package_count integer not null default 1 check (package_count > 0),
  carrier text not null,
  status text not null default 'generado' check (status in ('borrador', 'generado', 'impreso', 'anulado')),
  pdf_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists labels_created_at_idx on public.labels (created_at desc);
create index if not exists labels_order_number_idx on public.labels (order_number);
create index if not exists labels_recipient_city_idx on public.labels ((recipient->>'city'));
create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;
alter table public.settings enable row level security;
alter table public.order_sequences enable row level security;
alter table public.labels enable row level security;

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.order_sequences to authenticated;
grant select, insert, update, delete on public.labels to authenticated;

create policy "Authenticated users can read customers."
  on public.customers for select to authenticated
  using (true);

create policy "Authenticated users can insert customers."
  on public.customers for insert to authenticated
  with check (true);

create policy "Authenticated users can update customers."
  on public.customers for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete customers."
  on public.customers for delete to authenticated
  using (true);

create policy "Authenticated users can read settings."
  on public.settings for select to authenticated
  using (true);

create policy "Authenticated users can insert settings."
  on public.settings for insert to authenticated
  with check (true);

create policy "Authenticated users can update settings."
  on public.settings for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read sequences."
  on public.order_sequences for select to authenticated
  using (true);

create policy "Authenticated users can insert sequences."
  on public.order_sequences for insert to authenticated
  with check (true);

create policy "Authenticated users can update sequences."
  on public.order_sequences for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read labels."
  on public.labels for select to authenticated
  using (true);

create policy "Authenticated users can insert labels."
  on public.labels for insert to authenticated
  with check (true);

create policy "Authenticated users can update labels."
  on public.labels for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete labels."
  on public.labels for delete to authenticated
  using (true);

create or replace function public.reserve_order_number(
  p_scope_key text,
  p_prefix text,
  p_suffix text,
  p_pattern text,
  p_sequence_digits integer,
  p_date_format text,
  p_reset_policy text,
  p_label_date date,
  p_city text,
  p_department text,
  p_manual_order_number text default null
)
returns text
language plpgsql
as $$
declare
  next_value bigint;
  order_number text;
  year_text text;
  month_text text;
  day_text text;
  date_text text;
  city_text text;
  department_text text;
begin
  if p_manual_order_number is not null and length(trim(p_manual_order_number)) > 0 then
    if exists (select 1 from public.labels where order_number = trim(p_manual_order_number)) then
      raise exception 'duplicate_order_number';
    end if;
    return trim(p_manual_order_number);
  end if;

  insert into public.order_sequences (scope_key, current_value, reset_policy)
  values (p_scope_key, 0, p_reset_policy)
  on conflict (scope_key) do nothing;

  update public.order_sequences
  set current_value = current_value + 1,
      reset_policy = p_reset_policy,
      updated_at = now()
  where scope_key = p_scope_key
  returning current_value into next_value;

  year_text := to_char(p_label_date, 'YYYY');
  month_text := to_char(p_label_date, 'MM');
  day_text := to_char(p_label_date, 'DD');
  date_text := case p_date_format
    when 'YYYYMMDD' then to_char(p_label_date, 'YYYYMMDD')
    when 'YYYYMM' then to_char(p_label_date, 'YYYYMM')
    else to_char(p_label_date, 'YYYY')
  end;
  city_text := upper(regexp_replace(coalesce(p_city, ''), '[^[:alnum:]]+', '', 'g'));
  department_text := upper(regexp_replace(coalesce(p_department, ''), '[^[:alnum:]]+', '', 'g'));

  order_number := p_pattern;
  order_number := replace(order_number, '{PREFIX}', upper(regexp_replace(coalesce(p_prefix, ''), '[^[:alnum:]]+', '', 'g')));
  order_number := replace(order_number, '{SUFFIX}', upper(regexp_replace(coalesce(p_suffix, ''), '[^[:alnum:]]+', '', 'g')));
  order_number := replace(order_number, '{YEAR}', year_text);
  order_number := replace(order_number, '{MONTH}', month_text);
  order_number := replace(order_number, '{DAY}', day_text);
  order_number := replace(order_number, '{DATE}', date_text);
  order_number := replace(order_number, '{SEQUENCE}', lpad(next_value::text, p_sequence_digits, '0'));
  order_number := replace(order_number, '{CITY}', city_text);
  order_number := replace(order_number, '{DEPARTMENT}', department_text);

  if exists (select 1 from public.labels where order_number = order_number) then
    raise exception 'duplicate_order_number';
  end if;

  return order_number;
end;
$$;

revoke all on function public.reserve_order_number(text, text, text, text, integer, text, text, date, text, text, text) from public;
grant execute on function public.reserve_order_number(text, text, text, text, integer, text, text, date, text, text, text) to authenticated;
```

- [ ] **Step 2: Implement Supabase clients**

Create `apps/rotulos/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createClient() {
  if (!hasSupabaseEnv()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Create `apps/rotulos/src/lib/supabase/server.ts`:

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 3: Implement label store interface and local fallback**

Create `apps/rotulos/src/lib/label-store.ts`:

```ts
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

export type LabelStore = {
  listLabels(): Promise<LabelRecord[]>;
  getLabel(id: string): Promise<LabelRecord | null>;
  saveLabel(draft: LabelDraft, settings: LabelSettings): Promise<LabelRecord>;
  deleteLabel(id: string): Promise<void>;
  duplicateLabel(id: string): Promise<LabelDraft | null>;
  getSettings(): Promise<LabelSettings>;
  saveSettings(settings: LabelSettings): Promise<LabelSettings>;
  estimateNextOrderNumber(settings: LabelSettings, draft: LabelDraft): Promise<string>;
};

const memoryLabels: LabelRecord[] = [];
let memorySettings: LabelSettings = defaultSettings;
let memorySequence = 0;

function toRecord(draft: LabelDraft): LabelRecord {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: draft.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    pdfUrl: null,
    createdBy: null,
  };
}

export function createLocalLabelStore(): LabelStore {
  return {
    async listLabels() {
      return [...memoryLabels].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getLabel(id) {
      return memoryLabels.find((label) => label.id === id) ?? null;
    },
    async saveLabel(draft, settings) {
      const manual = draft.orderNumber.trim();
      if (manual && memoryLabels.some((label) => label.orderNumber === manual && label.id !== draft.id)) {
        throw new Error("duplicate_order_number");
      }
      const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: ++memorySequence,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
      const record = toRecord({ ...draft, orderNumber, status: "generado" });
      const index = memoryLabels.findIndex((label) => label.id === record.id);
      if (index >= 0) memoryLabels[index] = record;
      else memoryLabels.unshift(record);
      return record;
    },
    async deleteLabel(id) {
      const index = memoryLabels.findIndex((label) => label.id === id);
      if (index >= 0) memoryLabels.splice(index, 1);
    },
    async duplicateLabel(id) {
      const label = memoryLabels.find((item) => item.id === id);
      if (!label) return null;
      return { ...createBlankLabelDraft(), sender: label.sender, recipient: label.recipient, carrier: label.carrier, paymentMethod: label.paymentMethod, codAmount: label.codAmount, packageCount: label.packageCount };
    },
    async getSettings() {
      return memorySettings;
    },
    async saveSettings(settings) {
      memorySettings = settings;
      return settings;
    },
    async estimateNextOrderNumber(settings, draft) {
      const scope = getSequenceScope(settings.orderNumberConfig.resetPolicy, new Date(`${draft.date}T00:00:00Z`));
      void scope;
      return formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: memorySequence + 1,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
    },
  };
}

export function getLabelStore(): LabelStore {
  return createLocalLabelStore();
}
```

- [ ] **Step 4: Verify SQL syntax manually**

Run:

```powershell
Get-Content apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql | Select-String "enable row level security"
```

Expected: four RLS enable statements are present.

- [ ] **Step 5: Run tests and typecheck**

Run:

```powershell
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run typecheck
```

Expected: PASS and typecheck exits with code 0.

- [ ] **Step 6: Commit**

```powershell
git add apps/rotulos/supabase apps/rotulos/src/lib/supabase apps/rotulos/src/lib/label-store.ts
git commit -m "feat(rotulos): add Supabase schema and store"
```

---

### Task 4: Build App Shell, Dashboard, and Navigation

**Files:**
- Create: `apps/rotulos/src/components/app-shell.tsx`
- Create: `apps/rotulos/src/components/dashboard-stats.tsx`
- Modify: `apps/rotulos/src/app/layout.tsx`
- Modify: `apps/rotulos/src/app/page.tsx`
- Modify: `apps/rotulos/src/app/globals.css`

**Interfaces:**
- Consumes: `getLabelStore().listLabels()`.
- Produces: shared navigation links for `/`, `/crear`, `/historial`, `/configuracion`.

- [ ] **Step 1: Create app shell**

Create `apps/rotulos/src/components/app-shell.tsx`:

```tsx
import Link from "next/link";
import { PackagePlus, Settings, Tags } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-purpleShop-paper text-purpleShop-ink">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-black/10 bg-white px-5 py-6 lg:block">
        <div className="text-xl font-bold text-purpleShop-dark">PurpleShop</div>
        <div className="mt-1 text-sm text-neutral-500">Rotulos de envio</div>
        <nav className="mt-8 grid gap-2">
          <Link className="nav-link" href="/"><Tags size={18} /> Dashboard</Link>
          <Link className="nav-link" href="/crear"><PackagePlus size={18} /> Crear rotulo</Link>
          <Link className="nav-link" href="/historial"><Tags size={18} /> Historial</Link>
          <Link className="nav-link" href="/configuracion"><Settings size={18} /> Configuracion</Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="font-bold text-purpleShop-dark">PurpleShop Rotulos</div>
          <nav className="mt-3 flex gap-2 overflow-x-auto text-sm">
            <Link className="mobile-nav-link" href="/">Dashboard</Link>
            <Link className="mobile-nav-link" href="/crear">Crear</Link>
            <Link className="mobile-nav-link" href="/historial">Historial</Link>
            <Link className="mobile-nav-link" href="/configuracion">Config</Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire shell into layout**

Modify `apps/rotulos/src/app/layout.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PurpleShop Rotulos",
  description: "Generador de rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create dashboard stats component**

Create `apps/rotulos/src/components/dashboard-stats.tsx`:

```tsx
import Link from "next/link";
import type { LabelRecord } from "@/lib/types";

function isToday(value: string): boolean {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function DashboardStats({ labels }: { labels: LabelRecord[] }) {
  const todayCount = labels.filter((label) => isToday(label.createdAt)).length;
  const latest = labels.slice(0, 5);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-card"><span>Total rotulos</span><strong>{labels.length}</strong></div>
        <div className="metric-card"><span>Generados hoy</span><strong>{todayCount}</strong></div>
        <Link className="primary-action" href="/crear">Crear rotulo</Link>
      </div>
      <section className="panel">
        <div className="panel-title">Ultimos rotulos</div>
        <div className="divide-y divide-black/10">
          {latest.length === 0 ? (
            <p className="py-8 text-sm text-neutral-500">Aun no hay rotulos guardados.</p>
          ) : latest.map((label) => (
            <div className="flex items-center justify-between py-3" key={label.id}>
              <div>
                <div className="font-semibold">{label.recipient.fullName}</div>
                <div className="text-sm text-neutral-500">{label.orderNumber} · {label.recipient.city}</div>
              </div>
              <Link className="text-sm font-semibold text-purpleShop" href={`/crear?id=${label.id}`}>Editar</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Update dashboard page**

Modify `apps/rotulos/src/app/page.tsx`:

```tsx
import { DashboardStats } from "@/components/dashboard-stats";
import { getLabelStore } from "@/lib/label-store";

export default async function DashboardPage() {
  const labels = await getLabelStore().listLabels();

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Operacion diaria</p>
        <h1>Rotulos de envio</h1>
      </div>
      <DashboardStats labels={labels} />
    </main>
  );
}
```

- [ ] **Step 5: Add app CSS utilities**

Append to `apps/rotulos/src/app/globals.css`:

```css
.page-shell {
  min-height: 100vh;
  padding: 24px;
}

.page-heading {
  margin-bottom: 24px;
}

.page-heading p {
  margin: 0 0 6px;
  color: #6b1fa2;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: #3b0a57;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.nav-link,
.mobile-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 12px;
  color: #3b0a57;
  font-weight: 700;
  text-decoration: none;
}

.nav-link:hover,
.mobile-nav-link:hover {
  background: #f5f5f7;
}

.panel,
.metric-card {
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
}

.metric-card span {
  display: block;
  color: #666666;
  font-size: 0.85rem;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #3b0a57;
  font-size: 2.1rem;
}

.primary-action {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #6b1fa2;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
}

.panel-title {
  margin-bottom: 12px;
  color: #3b0a57;
  font-size: 1.1rem;
  font-weight: 800;
}
```

- [ ] **Step 6: Verify build**

Run:

```powershell
npm --prefix apps/rotulos run build
```

Expected: build exits with code 0.

- [ ] **Step 7: Commit**

```powershell
git add apps/rotulos/src/app apps/rotulos/src/components
git commit -m "feat(rotulos): add app shell and dashboard"
```

---

### Task 5: Build Label Preview and Form

**Files:**
- Create: `apps/rotulos/src/components/label-preview.tsx`
- Create: `apps/rotulos/src/components/sender-fields.tsx`
- Create: `apps/rotulos/src/components/recipient-fields.tsx`
- Create: `apps/rotulos/src/components/shipment-fields.tsx`
- Create: `apps/rotulos/src/components/order-number-preview.tsx`
- Create: `apps/rotulos/src/components/label-actions.tsx`
- Create: `apps/rotulos/src/components/label-form.tsx`
- Create: `apps/rotulos/src/app/crear/page.tsx`
- Create: `apps/rotulos/src/__tests__/label-preview.test.tsx`
- Modify: `apps/rotulos/src/app/globals.css`

**Interfaces:**
- Consumes: `LabelDraft`, `LabelSettings`, `validateLabelDraft`.
- Produces: visible label preview with `data-testid="label-canvas"` and exact CSS size.

- [ ] **Step 1: Write preview tests**

Create `apps/rotulos/src/__tests__/label-preview.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultSettings, createBlankLabelDraft } from "@/lib/defaults";
import { LabelPreview } from "@/components/label-preview";

describe("LabelPreview", () => {
  it("renders QR, order number, sender, recipient, and exact canvas marker", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000001";
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Calle 1 # 2-3",
    };
    draft.recipient = {
      fullName: "Ana Perez",
      phone: "3101234567",
      department: "Antioquia",
      city: "Medellin",
      address: "Carrera 45 # 10-20",
      neighborhood: "Laureles",
      reference: "Porteria principal",
      notes: "Entregar en la tarde",
    };

    render(<LabelPreview draft={draft} settings={defaultSettings} />);

    expect(screen.getByTestId("label-canvas")).toHaveClass("label-canvas");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("PurpleShop")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByAltText("QR de Instagram PurpleShop")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run preview test and verify failure**

Run:

```powershell
npm --prefix apps/rotulos run test -- label-preview
```

Expected: FAIL because `LabelPreview` does not exist.

- [ ] **Step 3: Implement preview component**

Create `apps/rotulos/src/components/label-preview.tsx`:

```tsx
import type { LabelDraft, LabelSettings } from "@/lib/types";
import { formatCop, formatDate } from "@/lib/format";

export function LabelPreview({ draft, settings }: { draft: LabelDraft; settings: LabelSettings }) {
  return (
    <section className="label-canvas" data-testid="label-canvas" aria-label="Vista previa del rotulo">
      <header className="label-header">
        <div className="label-brand">
          <img src={settings.logoUrl} alt="Logo PurpleShop" />
          <div>
            <strong>PurpleShop</strong>
            <span>{settings.brandPhrase}</span>
          </div>
        </div>
        <div className="label-social">
          <img src={settings.qrUrl} alt="QR de Instagram PurpleShop" />
          <span>{settings.instagramUser}</span>
        </div>
      </header>

      <div className="label-meta">
        <strong>{draft.orderNumber || "PS-2026-000001"}</strong>
        <span>{formatDate(draft.date)}</span>
        <span>{draft.carrier || "Transportadora"}</span>
        <span>{draft.packageCount} paquete{draft.packageCount === 1 ? "" : "s"}</span>
      </div>

      <div className="label-grid">
        <section className="label-block sender">
          <h2>Remitente</h2>
          <p className="person">{draft.sender.name || "PurpleShop"}</p>
          <p>Tel: {draft.sender.phone || "300 000 0000"}</p>
          <p>{draft.sender.city || "Ciudad"}, {draft.sender.department || "Departamento"}</p>
          <p>{draft.sender.address || "Direccion del remitente"}</p>
        </section>
        <section className="label-block recipient">
          <h2>Destinatario</h2>
          <p className="person">{draft.recipient.fullName || "Nombre del cliente"}</p>
          <p className="phone">Tel: {draft.recipient.phone || "310 000 0000"}</p>
          <p>{draft.recipient.city || "Ciudad"}, {draft.recipient.department || "Departamento"}</p>
          <p className="address">{draft.recipient.address || "Direccion completa del destinatario"}</p>
          <p>Barrio: {draft.recipient.neighborhood || "Sector"}</p>
          <p>Ref: {draft.recipient.reference || "Indicaciones de entrega"}</p>
        </section>
      </div>

      <footer className="label-footer">
        <span className={draft.paymentMethod === "contraentrega" ? "cod-badge" : "paid-badge"}>
          {draft.paymentMethod === "contraentrega" ? `Contraentrega ${formatCop(draft.codAmount)}` : "Pagado"}
        </span>
        <span>{draft.recipient.notes || "Gracias por comprar en PurpleShop"}</span>
      </footer>
    </section>
  );
}
```

- [ ] **Step 4: Add label physical CSS**

Append to `apps/rotulos/src/app/globals.css`:

```css
.label-canvas {
  width: 14cm;
  height: 11cm;
  overflow: hidden;
  border: 1px solid #111111;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(17, 17, 17, 0.16);
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
}

.label-header {
  display: flex;
  height: 2.2cm;
  align-items: center;
  justify-content: space-between;
  background: #6b1fa2;
  color: #ffffff;
  padding: 0.22cm 0.35cm;
}

.label-brand {
  display: flex;
  align-items: center;
  gap: 0.22cm;
}

.label-brand img {
  width: 1.38cm;
  height: 1.38cm;
  object-fit: contain;
  border-radius: 4px;
  background: #ffffff;
}

.label-brand strong {
  display: block;
  font-size: 0.48cm;
  line-height: 1;
}

.label-brand span,
.label-social span {
  display: block;
  font-size: 0.24cm;
}

.label-social {
  display: grid;
  justify-items: center;
  gap: 0.08cm;
}

.label-social img {
  width: 1.55cm;
  height: 1.55cm;
  object-fit: contain;
  background: #ffffff;
  padding: 0.05cm;
}

.label-meta {
  display: grid;
  grid-template-columns: 1.7fr repeat(3, 1fr);
  border-bottom: 1px solid #111111;
  font-size: 0.25cm;
}

.label-meta > * {
  min-width: 0;
  border-right: 1px solid #111111;
  padding: 0.12cm 0.16cm;
}

.label-meta > *:last-child {
  border-right: 0;
}

.label-grid {
  display: grid;
  height: 6.7cm;
  grid-template-columns: 0.82fr 1.18fr;
}

.label-block {
  min-width: 0;
  border-right: 1px solid #111111;
  padding: 0.22cm;
  font-size: 0.25cm;
}

.label-block:last-child {
  border-right: 0;
}

.label-block h2 {
  margin: 0 0 0.12cm;
  color: #3b0a57;
  font-size: 0.26cm;
  text-transform: uppercase;
}

.label-block p {
  margin: 0 0 0.11cm;
  overflow-wrap: anywhere;
}

.label-block .person {
  font-size: 0.36cm;
  font-weight: 800;
}

.recipient .person {
  font-size: 0.48cm;
}

.recipient .address {
  min-height: 1.55cm;
  border: 1px solid rgba(17, 17, 17, 0.35);
  border-radius: 4px;
  padding: 0.12cm;
  font-size: 0.34cm;
  font-weight: 700;
  line-height: 1.18;
}

.label-footer {
  display: flex;
  height: 1.34cm;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #111111;
  padding: 0.18cm 0.25cm;
  font-size: 0.27cm;
}

.cod-badge,
.paid-badge {
  border-radius: 999px;
  padding: 0.12cm 0.24cm;
  font-weight: 800;
}

.cod-badge {
  background: #111111;
  color: #ffffff;
}

.paid-badge {
  background: #f5f5f7;
  color: #111111;
}

@media print {
  @page {
    size: 14cm 11cm;
    margin: 0;
  }

  body {
    background: #ffffff;
  }

  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: fixed;
    inset: 0;
  }

  .label-canvas {
    width: 14cm;
    height: 11cm;
    border-radius: 0;
    box-shadow: none;
  }
}
```

- [ ] **Step 5: Implement form field components**

Create `apps/rotulos/src/components/sender-fields.tsx`:

```tsx
import type { Sender } from "@/lib/types";

export function SenderFields({ value, onChange, errors }: { value: Sender; onChange: (value: Sender) => void; errors: Record<string, string> }) {
  const set = (key: keyof Sender, next: string) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Remitente</legend>
      {(["name", "phone", "department", "city", "address"] as const).map((key) => (
        <label className="field" key={key}>
          <span>{key === "name" ? "Nombre / Empresa" : key === "phone" ? "Telefono" : key === "department" ? "Departamento" : key === "city" ? "Ciudad" : "Direccion"}</span>
          <input value={value[key]} onChange={(event) => set(key, event.target.value)} />
          {errors[`sender.${key}`] ? <small>{errors[`sender.${key}`]}</small> : null}
        </label>
      ))}
    </fieldset>
  );
}
```

Create `apps/rotulos/src/components/recipient-fields.tsx`:

```tsx
import type { Recipient } from "@/lib/types";

const labels: Record<keyof Recipient, string> = {
  fullName: "Nombre y apellidos",
  phone: "Telefono",
  department: "Departamento",
  city: "Ciudad",
  address: "Direccion completa",
  neighborhood: "Barrio / sector",
  reference: "Referencia o indicaciones",
  notes: "Observaciones",
};

export function RecipientFields({ value, onChange, errors }: { value: Recipient; onChange: (value: Recipient) => void; errors: Record<string, string> }) {
  const set = (key: keyof Recipient, next: string) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Destinatario</legend>
      {(Object.keys(labels) as Array<keyof Recipient>).map((key) => (
        <label className="field" key={key}>
          <span>{labels[key]}</span>
          {key === "address" || key === "reference" || key === "notes" ? (
            <textarea value={value[key]} onChange={(event) => set(key, event.target.value)} rows={key === "address" ? 3 : 2} />
          ) : (
            <input value={value[key]} onChange={(event) => set(key, event.target.value)} />
          )}
          {errors[`recipient.${key}`] ? <small>{errors[`recipient.${key}`]}</small> : null}
        </label>
      ))}
    </fieldset>
  );
}
```

Create `apps/rotulos/src/components/shipment-fields.tsx`:

```tsx
import type { LabelDraft } from "@/lib/types";

export function ShipmentFields({ value, onChange, errors, allowManualEdit }: { value: LabelDraft; onChange: (value: LabelDraft) => void; errors: Record<string, string>; allowManualEdit: boolean }) {
  const set = <K extends keyof LabelDraft>(key: K, next: LabelDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Datos del envio</legend>
      <label className="field">
        <span>Numero de pedido</span>
        <input value={value.orderNumber} disabled={!allowManualEdit} onChange={(event) => set("orderNumber", event.target.value)} />
        {errors.orderNumber ? <small>{errors.orderNumber}</small> : null}
      </label>
      <label className="field"><span>Fecha</span><input type="date" value={value.date} onChange={(event) => set("date", event.target.value)} /></label>
      <label className="field"><span>Transportadora</span><input value={value.carrier} onChange={(event) => set("carrier", event.target.value)} /></label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
      <label className="field"><span>Valor contraentrega</span><input type="number" min="0" value={value.codAmount} onChange={(event) => set("codAmount", Number(event.target.value))} />{errors.codAmount ? <small>{errors.codAmount}</small> : null}</label>
      <label className="field"><span>Cantidad de paquetes</span><input type="number" min="1" value={value.packageCount} onChange={(event) => set("packageCount", Number(event.target.value))} />{errors.packageCount ? <small>{errors.packageCount}</small> : null}</label>
    </fieldset>
  );
}
```

- [ ] **Step 6: Implement label form and create page**

Create `apps/rotulos/src/components/order-number-preview.tsx`:

```tsx
export function OrderNumberPreview({ value }: { value: string }) {
  return (
    <div className="order-preview">
      <span>Proximo numero estimado</span>
      <strong>{value}</strong>
    </div>
  );
}
```

Create `apps/rotulos/src/components/label-actions.tsx`:

```tsx
export function LabelActions({ onSave }: { onSave: () => void }) {
  return (
    <div className="label-actions">
      <button className="button-primary" type="button" onClick={onSave}>Guardar rotulo</button>
      <button className="button-secondary" type="button" onClick={() => window.print()}>Imprimir</button>
      <button className="button-secondary" type="button" disabled>Descargar PDF</button>
    </div>
  );
}
```

Create `apps/rotulos/src/components/label-form.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
import type { LabelDraft } from "@/lib/types";
import { LabelActions } from "@/components/label-actions";
import { LabelPreview } from "@/components/label-preview";
import { OrderNumberPreview } from "@/components/order-number-preview";
import { RecipientFields } from "@/components/recipient-fields";
import { SenderFields } from "@/components/sender-fields";
import { ShipmentFields } from "@/components/shipment-fields";

export function LabelForm() {
  const [draft, setDraft] = useState<LabelDraft>(() => {
    const initial = createBlankLabelDraft();
    initial.sender = defaultSettings.defaultSender;
    initial.orderNumber = formatOrderNumber(defaultSettings.orderNumberConfig, {
      date: new Date(`${initial.date}T00:00:00Z`),
      sequence: 1,
      city: initial.recipient.city,
      department: initial.recipient.department,
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextPreview = useMemo(() => formatOrderNumber(defaultSettings.orderNumberConfig, {
    date: new Date(`${draft.date}T00:00:00Z`),
    sequence: 1,
    city: draft.recipient.city,
    department: draft.recipient.department,
  }), [draft.date, draft.recipient.city, draft.recipient.department]);

  function saveDraft() {
    const result = validateLabelDraft(draft);
    setErrors(result.errors);
    if (!result.valid) return;
    window.alert("Rotulo validado. La persistencia se conecta en la siguiente tarea.");
  }

  return (
    <div className="creator-grid">
      <div className="form-stack">
        <OrderNumberPreview value={nextPreview} />
        <SenderFields value={draft.sender} onChange={(sender) => setDraft({ ...draft, sender })} errors={errors} />
        <RecipientFields value={draft.recipient} onChange={(recipient) => setDraft({ ...draft, recipient })} errors={errors} />
        <ShipmentFields value={draft} onChange={setDraft} errors={errors} allowManualEdit={defaultSettings.orderNumberConfig.allowManualEdit} />
        <LabelActions onSave={saveDraft} />
      </div>
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} settings={defaultSettings} />
      </div>
    </div>
  );
}
```

Create `apps/rotulos/src/app/crear/page.tsx`:

```tsx
import { LabelForm } from "@/components/label-form";

export default function CreateLabelPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Generador</p>
        <h1>Crear rotulo</h1>
      </div>
      <LabelForm />
    </main>
  );
}
```

- [ ] **Step 7: Add form CSS**

Append to `apps/rotulos/src/app/globals.css`:

```css
.creator-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(320px, 0.82fr) minmax(530px, 1fr);
  align-items: start;
}

.form-stack {
  display: grid;
  gap: 14px;
}

.form-section,
.order-preview,
.label-actions {
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
}

.form-section legend {
  color: #3b0a57;
  font-weight: 800;
}

.field {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.field span {
  font-size: 0.82rem;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 6px;
  padding: 10px 11px;
  font: inherit;
}

.field small {
  color: #b00020;
}

.order-preview span {
  display: block;
  color: #666666;
  font-size: 0.8rem;
  font-weight: 700;
}

.order-preview strong {
  display: block;
  margin-top: 4px;
  color: #3b0a57;
  font-size: 1.45rem;
}

.label-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-primary,
.button-secondary {
  border: 0;
  border-radius: 7px;
  padding: 11px 14px;
  font-weight: 800;
  cursor: pointer;
}

.button-primary {
  background: #6b1fa2;
  color: #ffffff;
}

.button-secondary {
  background: #f5f5f7;
  color: #111111;
}

.button-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.preview-rail {
  position: sticky;
  top: 24px;
  overflow-x: auto;
}

@media (max-width: 1100px) {
  .creator-grid {
    grid-template-columns: 1fr;
  }

  .preview-rail {
    position: static;
  }
}
```

- [ ] **Step 8: Run tests and build**

Run:

```powershell
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run build
```

Expected: tests and build pass.

- [ ] **Step 9: Commit**

```powershell
git add apps/rotulos/src/app apps/rotulos/src/components apps/rotulos/src/__tests__
git commit -m "feat(rotulos): add label creator and preview"
```

---

### Task 6: Add Settings and History Screens

**Files:**
- Create: `apps/rotulos/src/components/settings-form.tsx`
- Create: `apps/rotulos/src/components/history-table.tsx`
- Create: `apps/rotulos/src/app/configuracion/page.tsx`
- Create: `apps/rotulos/src/app/historial/page.tsx`

**Interfaces:**
- Consumes: `LabelStore` interface.
- Produces: settings form and searchable history UI.

- [ ] **Step 1: Implement settings form**

Create `apps/rotulos/src/components/settings-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { defaultSettings } from "@/lib/defaults";
import { formatOrderNumber } from "@/lib/order-number";
import type { LabelSettings } from "@/lib/types";

export function SettingsForm({ initialSettings = defaultSettings }: { initialSettings?: LabelSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const next = formatOrderNumber(settings.orderNumberConfig, {
    date: new Date("2026-07-15T00:00:00Z"),
    sequence: settings.orderNumberConfig.initialSequence,
    city: "Bogota",
    department: "Cundinamarca",
  });

  return (
    <div className="settings-grid">
      <section className="form-section">
        <legend>Marca</legend>
        <label className="field"><span>Logo</span><input value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} /></label>
        <label className="field"><span>QR oficial</span><input value={settings.qrUrl} onChange={(event) => setSettings({ ...settings, qrUrl: event.target.value })} /></label>
        <label className="field"><span>Instagram</span><input value={settings.instagramUser} onChange={(event) => setSettings({ ...settings, instagramUser: event.target.value })} /></label>
        <label className="field"><span>Frase de marca</span><input value={settings.brandPhrase} onChange={(event) => setSettings({ ...settings, brandPhrase: event.target.value })} /></label>
      </section>
      <section className="form-section">
        <legend>Numeracion</legend>
        <label className="field"><span>Formato</span><input value={settings.orderNumberConfig.pattern} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, pattern: event.target.value } })} /></label>
        <label className="field"><span>Prefijo</span><input value={settings.orderNumberConfig.prefix} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, prefix: event.target.value } })} /></label>
        <label className="field"><span>Sufijo</span><input value={settings.orderNumberConfig.suffix} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, suffix: event.target.value } })} /></label>
        <label className="field"><span>Digitos</span><input type="number" value={settings.orderNumberConfig.sequenceDigits} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, sequenceDigits: Number(event.target.value) } })} /></label>
        <div className="order-preview"><span>Proximo estimado</span><strong>{next}</strong></div>
      </section>
    </div>
  );
}
```

Create `apps/rotulos/src/app/configuracion/page.tsx`:

```tsx
import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Preferencias</p>
        <h1>Configuracion</h1>
      </div>
      <SettingsForm />
    </main>
  );
}
```

- [ ] **Step 2: Implement history table**

Create `apps/rotulos/src/components/history-table.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { LabelRecord } from "@/lib/types";

export function HistoryTable({ labels }: { labels: LabelRecord[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return labels;
    return labels.filter((label) =>
      label.orderNumber.toLowerCase().includes(needle) ||
      label.recipient.fullName.toLowerCase().includes(needle) ||
      label.recipient.phone.toLowerCase().includes(needle),
    );
  }, [labels, query]);

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar por numero de pedido, cliente o telefono</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="history-table">
        <div className="history-row history-head">
          <span>Cliente</span><span>Telefono</span><span>Ciudad</span><span>Pedido</span><span>Estado</span><span>Acciones</span>
        </div>
        {filtered.map((label) => (
          <div className="history-row" key={label.id}>
            <span>{label.recipient.fullName}</span>
            <span>{label.recipient.phone}</span>
            <span>{label.recipient.city}</span>
            <span>{label.orderNumber}</span>
            <span>{label.status}</span>
            <span className="row-actions">
              <button type="button">Imprimir</button>
              <button type="button">PDF</button>
              <button type="button">Duplicar</button>
              <button type="button">Editar</button>
              <button type="button">Eliminar</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Create `apps/rotulos/src/app/historial/page.tsx`:

```tsx
import { HistoryTable } from "@/components/history-table";
import { getLabelStore } from "@/lib/label-store";

export default async function HistoryPage() {
  const labels = await getLabelStore().listLabels();
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Consulta y reutilizacion</p>
        <h1>Historial</h1>
      </div>
      <HistoryTable labels={labels} />
    </main>
  );
}
```

- [ ] **Step 3: Add history/settings CSS**

Append to `apps/rotulos/src/app/globals.css`:

```css
.settings-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.history-table {
  margin-top: 16px;
  overflow-x: auto;
}

.history-row {
  display: grid;
  min-width: 900px;
  grid-template-columns: 1.3fr 0.9fr 0.9fr 1fr 0.7fr 2fr;
  gap: 12px;
  border-top: 1px solid rgba(17, 17, 17, 0.1);
  padding: 12px 0;
  align-items: center;
}

.history-head {
  color: #3b0a57;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row-actions button {
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 6px;
  background: #ffffff;
  padding: 6px 8px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run build**

Run:

```powershell
npm --prefix apps/rotulos run build
```

Expected: build exits with code 0.

- [ ] **Step 5: Commit**

```powershell
git add apps/rotulos/src/app apps/rotulos/src/components
git commit -m "feat(rotulos): add settings and history"
```

---

### Task 7: Add PDF Route and Wire PDF Button

**Files:**
- Create: `apps/rotulos/src/lib/pdf.ts`
- Create: `apps/rotulos/src/app/api/labels/[id]/pdf/route.ts`
- Modify: `apps/rotulos/src/components/label-actions.tsx`

**Interfaces:**
- Consumes: saved label ID.
- Produces: `GET /api/labels/[id]/pdf` returning `application/pdf`.

- [ ] **Step 1: Implement PDF HTML helper**

Create `apps/rotulos/src/lib/pdf.ts`:

```ts
import type { LabelDraft, LabelSettings } from "@/lib/types";

export function renderLabelPdfHtml(draft: LabelDraft, settings: LabelSettings): string {
  const safe = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]!));
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 14cm 11cm; margin: 0; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
    .label { width: 14cm; height: 11cm; overflow: hidden; border: 1px solid #111; }
    .header { height: 2.2cm; background: ${settings.brandColors.primary}; color: white; display:flex; align-items:center; justify-content:space-between; padding:0.22cm 0.35cm; }
    .brand { display:flex; align-items:center; gap:0.22cm; }
    .brand img { width:1.38cm; height:1.38cm; object-fit:contain; background:white; }
    .qr img { width:1.55cm; height:1.55cm; object-fit:contain; background:white; padding:0.05cm; }
    .meta { display:grid; grid-template-columns:1.7fr repeat(3,1fr); border-bottom:1px solid #111; font-size:0.25cm; }
    .meta span { border-right:1px solid #111; padding:0.12cm 0.16cm; }
    .grid { display:grid; height:6.7cm; grid-template-columns:0.82fr 1.18fr; }
    .block { border-right:1px solid #111; padding:0.22cm; font-size:0.25cm; }
    .block:last-child { border-right:0; }
    h2 { margin:0 0 0.12cm; color:${settings.brandColors.dark}; font-size:0.26cm; text-transform:uppercase; }
    p { margin:0 0 0.11cm; overflow-wrap:anywhere; }
    .person { font-size:0.36cm; font-weight:800; }
    .recipient .person { font-size:0.48cm; }
    .address { min-height:1.55cm; border:1px solid rgba(17,17,17,.35); border-radius:4px; padding:.12cm; font-size:.34cm; font-weight:700; line-height:1.18; }
    .footer { height:1.34cm; border-top:1px solid #111; display:flex; align-items:center; justify-content:space-between; padding:.18cm .25cm; font-size:.27cm; }
  </style>
</head>
<body>
  <main class="label">
    <header class="header"><div class="brand"><img src="${safe(settings.logoUrl)}" /><div><strong>PurpleShop</strong><br/><span>${safe(settings.brandPhrase)}</span></div></div><div class="qr"><img src="${safe(settings.qrUrl)}" /><br/><span>${safe(settings.instagramUser)}</span></div></header>
    <section class="meta"><span><strong>${safe(draft.orderNumber)}</strong></span><span>${safe(draft.date)}</span><span>${safe(draft.carrier)}</span><span>${draft.packageCount} paquete(s)</span></section>
    <section class="grid"><div class="block"><h2>Remitente</h2><p class="person">${safe(draft.sender.name)}</p><p>Tel: ${safe(draft.sender.phone)}</p><p>${safe(draft.sender.city)}, ${safe(draft.sender.department)}</p><p>${safe(draft.sender.address)}</p></div><div class="block recipient"><h2>Destinatario</h2><p class="person">${safe(draft.recipient.fullName)}</p><p>Tel: ${safe(draft.recipient.phone)}</p><p>${safe(draft.recipient.city)}, ${safe(draft.recipient.department)}</p><p class="address">${safe(draft.recipient.address)}</p><p>Barrio: ${safe(draft.recipient.neighborhood)}</p><p>Ref: ${safe(draft.recipient.reference)}</p></div></section>
    <footer class="footer"><strong>${draft.paymentMethod === "contraentrega" ? "CONTRAENTREGA" : "PAGADO"}</strong><span>${safe(draft.recipient.notes || "Gracias por comprar en PurpleShop")}</span></footer>
  </main>
</body>
</html>`;
}
```

- [ ] **Step 2: Implement route handler**

Create `apps/rotulos/src/app/api/labels/[id]/pdf/route.ts`:

```ts
import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { renderLabelPdfHtml } from "@/lib/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const label = await getLabelStore().getLabel(id);
  if (!label) {
    return NextResponse.json({ error: "label_not_found" }, { status: 404 });
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(renderLabelPdfHtml(label, defaultSettings), { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      width: "14cm",
      height: "11cm",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${label.orderNumber}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 3: Enable PDF button for saved labels**

Modify `apps/rotulos/src/components/label-actions.tsx`:

```tsx
export function LabelActions({ onSave, labelId }: { onSave: () => void; labelId?: string }) {
  return (
    <div className="label-actions">
      <button className="button-primary" type="button" onClick={onSave}>Guardar rotulo</button>
      <button className="button-secondary" type="button" onClick={() => window.print()}>Imprimir</button>
      <a className={`button-secondary ${labelId ? "" : "disabled-link"}`} href={labelId ? `/api/labels/${labelId}/pdf` : "#"} aria-disabled={!labelId}>
        Descargar PDF
      </a>
    </div>
  );
}
```

Append to `apps/rotulos/src/app/globals.css`:

```css
.disabled-link {
  pointer-events: none;
  opacity: 0.5;
}
```

- [ ] **Step 4: Run build**

Run:

```powershell
npm --prefix apps/rotulos run build
```

Expected: build exits with code 0.

- [ ] **Step 5: Commit**

```powershell
git add apps/rotulos/src/app/api apps/rotulos/src/lib/pdf.ts apps/rotulos/src/components/label-actions.tsx apps/rotulos/src/app/globals.css
git commit -m "feat(rotulos): add PDF generation route"
```

---

### Task 8: Add Root App Link and Documentation

**Files:**
- Modify: `index.html`
- Create: `apps/rotulos/README.md`

**Interfaces:**
- Produces: visible root navigation entry named `Rotulos de envio`.
- Produces: setup and deploy instructions.

- [ ] **Step 1: Add root app navigation entry**

Modify the tabs in `index.html` to add:

```html
<button
    class="tab-btn"
    type="button"
    onclick="window.open('http://localhost:3001', '_blank', 'noopener,noreferrer')"
    aria-label="Abrir generador de rótulos de envío"
>
    🏷️ Rótulos de envío
</button>
```

Place it after the existing `Inventarios` tab button.

- [ ] **Step 2: Add README**

Create `apps/rotulos/README.md`:

```md
# PurpleShop Rotulos

App Next.js para crear, guardar, imprimir y descargar rotulos de envio de PurpleShop.

## Desarrollo local

```bash
npm install --prefix apps/rotulos
npm --prefix apps/rotulos run dev
```

Abre `http://localhost:3001`.

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ROTULOS_BASE_URL`

## Supabase

Aplica la migracion en `supabase/migrations`.

Todas las tablas publicas tienen RLS habilitado. La app usa claves publicas en el navegador y reserva el uso de `SUPABASE_SERVICE_ROLE_KEY` para rutas del servidor.

## Scripts

```bash
npm --prefix apps/rotulos run dev
npm --prefix apps/rotulos run build
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run test:e2e
```

## PDF e impresion

El rotulo usa tamano fisico `14cm x 11cm`. La vista previa, impresion y PDF comparten los mismos datos y respetan el mismo tamano.

## Despliegue en Vercel

1. Crea un proyecto Vercel apuntando a `apps/rotulos`.
2. Configura las variables de entorno.
3. Aplica las migraciones de Supabase.
4. Ejecuta una prueba descargando PDF y revisando que el QR, logo y direccion aparezcan completos.
```

- [ ] **Step 3: Verify root static app still serves**

Run:

```powershell
npm start
```

Expected: root app serves on port 8000. Stop server after confirming.

- [ ] **Step 4: Commit**

```powershell
git add index.html apps/rotulos/README.md
git commit -m "docs(rotulos): add setup guide and root link"
```

---

### Task 9: Add E2E Verification for Preview, Mobile, Print, and History

**Files:**
- Create: `apps/rotulos/e2e/rotulos.spec.ts`
- Modify: `apps/rotulos/src/components/history-table.tsx`
- Modify: `apps/rotulos/src/components/label-actions.tsx`

**Interfaces:**
- Consumes: routes `/`, `/crear`, `/historial`, `/configuracion`.
- Produces: Playwright checks for QR, physical canvas dimensions, mobile layout, print button, and history search UI.

- [ ] **Step 1: Write E2E test**

Create `apps/rotulos/e2e/rotulos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("creates visible label preview with QR and exact ratio", async ({ page }) => {
  await page.goto("/crear");
  await expect(page.getByTestId("label-canvas")).toBeVisible();
  await expect(page.getByAltText("QR de Instagram PurpleShop")).toBeVisible();
  await page.getByLabel("Nombre y apellidos").fill("Ana Perez");
  await page.getByLabel("Telefono").nth(1).fill("3101234567");
  await page.getByLabel("Ciudad").nth(1).fill("Medellin");
  await page.getByLabel("Direccion completa").fill("Carrera 45 # 10-20");
  await expect(page.getByText("Ana Perez")).toBeVisible();

  const box = await page.getByTestId("label-canvas").boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round((box!.width / box!.height) * 100)).toBe(127);
});

test("history search field is available", async ({ page }) => {
  await page.goto("/historial");
  await expect(page.getByText("Historial")).toBeVisible();
  await expect(page.getByLabel("Buscar por numero de pedido, cliente o telefono")).toBeVisible();
});

test("settings shows estimated next order number", async ({ page }) => {
  await page.goto("/configuracion");
  await expect(page.getByText("PS-2026-000001")).toBeVisible();
});
```

- [ ] **Step 2: Run E2E and fix label associations if needed**

Run:

```powershell
npm --prefix apps/rotulos run test:e2e
```

Expected: PASS. If label lookups fail because labels lack `htmlFor`, add explicit `id` and `htmlFor` pairs to the field components.

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm --prefix apps/rotulos run test
npm --prefix apps/rotulos run typecheck
npm --prefix apps/rotulos run build
npm --prefix apps/rotulos run test:e2e
```

Expected: all pass.

- [ ] **Step 4: Commit**

```powershell
git add apps/rotulos/e2e apps/rotulos/src/components
git commit -m "test(rotulos): verify label workflows"
```

---

## Self-Review

Spec coverage:

- Dashboard: Task 4.
- Create label form: Task 5.
- Live preview: Task 5.
- PDF and print: Tasks 5 and 7.
- History: Task 6.
- Settings: Task 6.
- UI/UX and PurpleShop palette: Tasks 1, 4, 5, 6.
- Supabase tables and RLS: Task 3.
- TypeScript and reusable components: Tasks 1 through 7.
- README and deploy instructions: Task 8.
- Automatic order numbering: Tasks 2 and 3.
- Verification checks: Task 9.

Placeholder scan:

- No placeholder markers are intentionally present.
- Each task includes concrete file paths, commands, expected outcomes, and commit commands.

Type consistency:

- `LabelDraft`, `LabelRecord`, `LabelSettings`, `OrderNumberConfig`, and `LabelStore` are introduced before use.
- `formatOrderNumber`, `getSequenceScope`, `validateLabelDraft`, and `getLabelStore` signatures match later tasks.
