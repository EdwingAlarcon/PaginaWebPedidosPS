"use client";

import { useEffect, useState } from "react";
import { defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import type { LabelSettings, OrderNumberConfig } from "@/lib/types";

type SettingsFormProps = {
  initialSettings?: LabelSettings;
  onSave?: (settings: LabelSettings) => Promise<unknown>;
};

export function SettingsForm({ initialSettings = defaultSettings, onSave = (settings) => getLabelStore().saveSettings(settings) }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saveStatus, setSaveStatus] = useState("");
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
    await onSave(settings);
    setSaveStatus("Configuracion guardada.");
  }

  return (
    <div>
      <div className="settings-grid">
        <section className="form-section">
          <legend>Marca</legend>
          <label className="field"><span>Logo</span><input value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} /></label>
          <label className="field"><span>QR oficial</span><input value={settings.qrUrl} onChange={(event) => setSettings({ ...settings, qrUrl: event.target.value })} /></label>
          <label className="field"><span>Instagram</span><input value={settings.instagramUser} onChange={(event) => setSettings({ ...settings, instagramUser: event.target.value })} /></label>
          <label className="field"><span>Frase de marca</span><input value={settings.brandPhrase} onChange={(event) => setSettings({ ...settings, brandPhrase: event.target.value })} /></label>
          <label className="field"><span>Morado principal</span><input type="color" value={settings.brandColors.primary} onChange={(event) => updateColor("primary", event.target.value)} /></label>
          <label className="field"><span>Morado oscuro</span><input type="color" value={settings.brandColors.dark} onChange={(event) => updateColor("dark", event.target.value)} /></label>
          <label className="field"><span>Morado claro</span><input type="color" value={settings.brandColors.light} onChange={(event) => updateColor("light", event.target.value)} /></label>
        </section>
        <section className="form-section">
          <legend>Numeracion</legend>
          <label className="field"><span>Formato</span><input value={settings.orderNumberConfig.pattern} onChange={(event) => updateOrderConfig({ pattern: event.target.value })} /></label>
          <label className="field"><span>Prefijo</span><input value={settings.orderNumberConfig.prefix} onChange={(event) => updateOrderConfig({ prefix: event.target.value })} /></label>
          <label className="field"><span>Sufijo</span><input value={settings.orderNumberConfig.suffix} onChange={(event) => updateOrderConfig({ suffix: event.target.value })} /></label>
          <label className="field"><span>Numero inicial</span><input type="number" min="1" value={settings.orderNumberConfig.initialSequence} onChange={(event) => updateOrderConfig({ initialSequence: Number(event.target.value) })} /></label>
          <label className="field"><span>Digitos</span><input type="number" min="1" value={settings.orderNumberConfig.sequenceDigits} onChange={(event) => updateOrderConfig({ sequenceDigits: Number(event.target.value) })} /></label>
          <label className="field"><span>Separador</span><select value={settings.orderNumberConfig.separator} onChange={(event) => updateOrderConfig({ separator: event.target.value as OrderNumberConfig["separator"] })}><option value="-">-</option><option value="/">/</option><option value=".">.</option></select></label>
          <label className="field"><span>Formato de fecha</span><select value={settings.orderNumberConfig.dateFormat} onChange={(event) => updateOrderConfig({ dateFormat: event.target.value as OrderNumberConfig["dateFormat"] })}><option value="YYYY">YYYY</option><option value="YYYYMM">YYYYMM</option><option value="YYYYMMDD">YYYYMMDD</option></select></label>
          <label className="field"><span>Reinicio</span><select value={settings.orderNumberConfig.resetPolicy} onChange={(event) => updateOrderConfig({ resetPolicy: event.target.value as OrderNumberConfig["resetPolicy"] })}><option value="never">Nunca</option><option value="daily">Diario</option><option value="monthly">Mensual</option><option value="annual">Anual</option></select></label>
          <label className="field checkbox-field"><input type="checkbox" checked={settings.orderNumberConfig.allowManualEdit} onChange={(event) => updateOrderConfig({ allowManualEdit: event.target.checked })} /><span>Permitir edicion manual</span></label>
          {sequenceDigitsError && <p className="validation-summary">Los digitos deben ser al menos 1.</p>}
          <div className="order-preview"><span>Proximo estimado</span><strong>{next}</strong></div>
        </section>
        <section className="form-section">
          <legend>Remitente por defecto</legend>
          <label className="field"><span>Nombre / Empresa</span><input value={settings.defaultSender.name} onChange={(event) => updateSender("name", event.target.value)} /></label>
          <label className="field"><span>Telefono</span><input value={settings.defaultSender.phone} onChange={(event) => updateSender("phone", event.target.value)} /></label>
          <label className="field"><span>Departamento</span><input value={settings.defaultSender.department} onChange={(event) => updateSender("department", event.target.value)} /></label>
          <label className="field"><span>Ciudad</span><input value={settings.defaultSender.city} onChange={(event) => updateSender("city", event.target.value)} /></label>
          <label className="field"><span>Direccion</span><input value={settings.defaultSender.address} onChange={(event) => updateSender("address", event.target.value)} /></label>
        </section>
        <section className="form-section">
          <legend>Plantilla</legend>
          <label className="field"><span>Ancho cm</span><input type="number" min="1" step="0.1" value={settings.labelSize.widthCm} onChange={(event) => setSettings({ ...settings, labelSize: { ...settings.labelSize, widthCm: Number(event.target.value) } })} /></label>
          <label className="field"><span>Alto cm</span><input type="number" min="1" step="0.1" value={settings.labelSize.heightCm} onChange={(event) => setSettings({ ...settings, labelSize: { ...settings.labelSize, heightCm: Number(event.target.value) } })} /></label>
          <label className="field"><span>Plantilla predeterminada</span><input value={settings.defaultTemplate} readOnly /></label>
        </section>
      </div>
      <div className="label-actions">
        <button className="button-primary" type="button" disabled={sequenceDigitsError} onClick={saveSettings}>Guardar configuracion</button>
      </div>
      {saveStatus && <p role="status">{saveStatus}</p>}
    </div>
  );
}
