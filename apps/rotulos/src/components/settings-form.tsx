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
