"use client";

import { useEffect, useId, useState } from "react";
import { defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import type { LabelSettings, OrderNumberConfig } from "@/lib/types";
import { LABEL_SIZES } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type SettingsFormProps = {
  initialSettings?: LabelSettings;
  onSave?: (settings: LabelSettings) => Promise<unknown>;
};

const PATTERN_PRESETS: { label: string; pattern: string }[] = [
  { label: "PREFIJO-AÑO-SECUENCIA", pattern: "{PREFIX}-{YEAR}-{SEQUENCE}" },
  { label: "PREFIJO/SECUENCIA", pattern: "{PREFIX}/{SEQUENCE}" },
  { label: "AÑOMES-SECUENCIA", pattern: "{YEARMONTH}-{SEQUENCE}" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="uppercase" />
      </div>
    </FormField>
  );
}

export function SettingsForm({ initialSettings = defaultSettings, onSave = (settings) => getLabelStore().saveSettings(settings) }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const allowManualEditId = useId();
  const sequenceDigitsError = !Number.isInteger(settings.orderNumberConfig.sequenceDigits) || settings.orderNumberConfig.sequenceDigits < 1;
  const updateOrderConfig = (patch: Partial<OrderNumberConfig>) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, ...patch } });
  const updateSender = (key: keyof LabelSettings["defaultSender"], value: string) => setSettings({ ...settings, defaultSender: { ...settings.defaultSender, [key]: value } });
  const updateColor = (key: keyof LabelSettings["brandColors"], value: string) => setSettings({ ...settings, brandColors: { ...settings.brandColors, [key]: value } });
  const next = formatOrderNumber(settings.orderNumberConfig, {
    date: new Date("2026-07-15T00:00:00Z"),
    sequence: settings.orderNumberConfig.initialSequence,
    city: "Bogota",
    department: "Cundinamarca",
  });

  useEffect(() => {
    getLabelStore().getSettings().then(setSettings);
  }, []);

  async function saveSettings() {
    if (sequenceDigitsError) return;
    setSaving(true);
    try {
      await onSave(settings);
      setSaveStatus("Configuracion guardada.");
    } finally {
      setSaving(false);
    }
  }

  const panelClass = "mt-4 data-[state=inactive]:hidden";

  return (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue="marca">
        <TabsList>
          <TabsTrigger value="marca">Marca</TabsTrigger>
          <TabsTrigger value="numeracion">Numeracion</TabsTrigger>
          <TabsTrigger value="remitente">Remitente</TabsTrigger>
          <TabsTrigger value="rotulos">Rotulos</TabsTrigger>
        </TabsList>

        <TabsContent value="marca" forceMount className={panelClass}>
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="URL del logo" hint="Se usa en el rotulo y el generador de PDF.">
                <Input value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} />
              </FormField>
              <div className="flex items-end">
                {settings.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoUrl} alt="Vista previa del logo" className="h-16 rounded-md border border-border bg-surface-muted object-contain p-2" />
                ) : null}
              </div>
              <FormField label="URL del QR" hint="Codigo QR mostrado en el rotulo.">
                <Input value={settings.qrUrl} onChange={(event) => setSettings({ ...settings, qrUrl: event.target.value })} />
              </FormField>
              <div className="flex items-end">
                {settings.qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.qrUrl} alt="Vista previa del QR" className="h-16 rounded-md border border-border bg-surface-muted object-contain p-2" />
                ) : null}
              </div>
              <FormField label="Instagram">
                <Input value={settings.instagramUser} onChange={(event) => setSettings({ ...settings, instagramUser: event.target.value })} />
              </FormField>
              <FormField label="Frase de marca">
                <Input value={settings.brandPhrase} onChange={(event) => setSettings({ ...settings, brandPhrase: event.target.value })} />
              </FormField>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <ColorField label="Morado principal" value={settings.brandColors.primary} onChange={(value) => updateColor("primary", value)} />
              <ColorField label="Morado oscuro" value={settings.brandColors.dark} onChange={(value) => updateColor("dark", value)} />
              <ColorField label="Morado claro" value={settings.brandColors.light} onChange={(value) => updateColor("light", value)} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="numeracion" forceMount className={panelClass}>
          <Card>
            <div className="flex flex-wrap gap-2">
              {PATTERN_PRESETS.map((preset) => (
                <Button
                  key={preset.pattern}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => updateOrderConfig({ pattern: preset.pattern })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Formato" className="sm:col-span-2" hint="Variables disponibles: {PREFIX} {SUFFIX} {YEAR} {YEARMONTH} {SEQUENCE}">
                <Input value={settings.orderNumberConfig.pattern} onChange={(event) => updateOrderConfig({ pattern: event.target.value })} />
              </FormField>
              <FormField label="Prefijo">
                <Input value={settings.orderNumberConfig.prefix} onChange={(event) => updateOrderConfig({ prefix: event.target.value })} />
              </FormField>
              <FormField label="Sufijo">
                <Input value={settings.orderNumberConfig.suffix} onChange={(event) => updateOrderConfig({ suffix: event.target.value })} />
              </FormField>
              <FormField label="Numero inicial">
                <Input type="number" min={1} value={settings.orderNumberConfig.initialSequence} onChange={(event) => updateOrderConfig({ initialSequence: Number(event.target.value) })} />
              </FormField>
              <FormField label="Digitos" error={sequenceDigitsError ? "Los digitos deben ser al menos 1." : undefined}>
                <Input type="number" min={1} value={settings.orderNumberConfig.sequenceDigits} onChange={(event) => updateOrderConfig({ sequenceDigits: Number(event.target.value) })} />
              </FormField>
              <FormField label="Separador">
                <Select value={settings.orderNumberConfig.separator} onChange={(event) => updateOrderConfig({ separator: event.target.value as OrderNumberConfig["separator"] })}>
                  <option value="-">-</option>
                  <option value="/">/</option>
                  <option value=".">.</option>
                </Select>
              </FormField>
              <FormField label="Formato de fecha">
                <Select value={settings.orderNumberConfig.dateFormat} onChange={(event) => updateOrderConfig({ dateFormat: event.target.value as OrderNumberConfig["dateFormat"] })}>
                  <option value="YYYY">YYYY</option>
                  <option value="YYYYMM">YYYYMM</option>
                  <option value="YYYYMMDD">YYYYMMDD</option>
                </Select>
              </FormField>
              <FormField label="Reinicio">
                <Select value={settings.orderNumberConfig.resetPolicy} onChange={(event) => updateOrderConfig({ resetPolicy: event.target.value as OrderNumberConfig["resetPolicy"] })}>
                  <option value="never">Nunca</option>
                  <option value="daily">Diario</option>
                  <option value="monthly">Mensual</option>
                  <option value="annual">Anual</option>
                </Select>
              </FormField>
            </div>
            <label htmlFor={allowManualEditId} className="mt-4 flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                id={allowManualEditId}
                checked={settings.orderNumberConfig.allowManualEdit}
                onCheckedChange={(checked) => updateOrderConfig({ allowManualEdit: checked === true })}
              />
              Permitir edicion manual
            </label>
            <div className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3">
              <span className="block text-xs font-medium text-foreground-muted">Proximo estimado</span>
              <strong className="mt-1 block text-lg font-semibold text-foreground">{next}</strong>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="remitente" forceMount className={panelClass}>
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombre / Empresa" className="sm:col-span-2">
                <Input value={settings.defaultSender.name} onChange={(event) => updateSender("name", event.target.value)} />
              </FormField>
              <FormField label="Telefono">
                <Input value={settings.defaultSender.phone} onChange={(event) => updateSender("phone", event.target.value)} />
              </FormField>
              <FormField label="Departamento">
                <Input value={settings.defaultSender.department} onChange={(event) => updateSender("department", event.target.value)} />
              </FormField>
              <FormField label="Ciudad">
                <Input value={settings.defaultSender.city} onChange={(event) => updateSender("city", event.target.value)} />
              </FormField>
              <FormField label="Direccion" className="sm:col-span-2">
                <Input value={settings.defaultSender.address} onChange={(event) => updateSender("address", event.target.value)} />
              </FormField>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rotulos" forceMount className={panelClass}>
          <Card>
            <FormField label="Tamano predeterminado" hint="Se usa como valor inicial al crear un rotulo nuevo.">
              <Select
                value={`${settings.labelSize.widthCm}x${settings.labelSize.heightCm}`}
                onChange={(event) => {
                  const [widthCm, heightCm] = event.target.value.split("x").map(Number);
                  setSettings({ ...settings, labelSize: { widthCm, heightCm } });
                }}
              >
                {Object.values(LABEL_SIZES).map((size) => (
                  <option key={size.label} value={`${size.widthCm}x${size.heightCm}`}>
                    {size.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Plantilla predeterminada" className="mt-4">
              <Input value={settings.defaultTemplate} readOnly disabled />
            </FormField>
          </Card>
        </TabsContent>
      </Tabs>

      {saveStatus ? (
        <Alert variant="success" role="status">
          {saveStatus}
        </Alert>
      ) : null}

      <div>
        <Button type="button" disabled={sequenceDigitsError} loading={saving} onClick={saveSettings}>
          Guardar configuracion
        </Button>
      </div>
    </div>
  );
}
