"use client";

import { useEffect, useState } from "react";
import { defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import type { LabelSettings } from "@/lib/types";

type SettingsFormProps = {
  initialSettings?: LabelSettings;
  onSave?: (settings: LabelSettings) => Promise<unknown>;
};

export function SettingsForm({ initialSettings = defaultSettings, onSave = (settings) => getLabelStore().saveSettings(settings) }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saveStatus, setSaveStatus] = useState("");
  const sequenceDigitsError = !Number.isInteger(settings.orderNumberConfig.sequenceDigits) || settings.orderNumberConfig.sequenceDigits < 1;
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
        </section>
        <section className="form-section">
          <legend>Numeracion</legend>
          <label className="field"><span>Formato</span><input value={settings.orderNumberConfig.pattern} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, pattern: event.target.value } })} /></label>
          <label className="field"><span>Prefijo</span><input value={settings.orderNumberConfig.prefix} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, prefix: event.target.value } })} /></label>
          <label className="field"><span>Sufijo</span><input value={settings.orderNumberConfig.suffix} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, suffix: event.target.value } })} /></label>
          <label className="field"><span>Digitos</span><input type="number" min="1" value={settings.orderNumberConfig.sequenceDigits} onChange={(event) => setSettings({ ...settings, orderNumberConfig: { ...settings.orderNumberConfig, sequenceDigits: Number(event.target.value) } })} /></label>
          {sequenceDigitsError && <p className="validation-summary">Los digitos deben ser al menos 1.</p>}
          <div className="order-preview"><span>Proximo estimado</span><strong>{next}</strong></div>
        </section>
      </div>
      <div className="label-actions">
        <button className="button-primary" type="button" disabled={sequenceDigitsError} onClick={saveSettings}>Guardar configuracion</button>
      </div>
      {saveStatus && <p role="status">{saveStatus}</p>}
    </div>
  );
}
