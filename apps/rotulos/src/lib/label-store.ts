import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";
import { createClient } from "@/lib/supabase/client";
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

const storageKeys = {
  labels: "purpleshop.rotulos.labels",
  settings: "purpleshop.rotulos.settings",
  sequences: "purpleshop.rotulos.sequences",
};
const memoryLabels: LabelRecord[] = [];
let memorySettings: LabelSettings = defaultSettings;
const memorySequences = new Map<string, number>();


type LabelRow = {
  id: string;
  order_number: string;
  sender: LabelDraft["sender"];
  recipient: LabelDraft["recipient"];
  shipment: { date?: string } | null;
  payment_method: LabelDraft["paymentMethod"];
  cod_amount: number | string;
  package_count: number;
  carrier: string;
  status: LabelDraft["status"];
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  default_sender: LabelSettings["defaultSender"];
  logo_url: string;
  qr_url: string;
  instagram_user: string;
  brand_phrase: string;
  brand_colors: LabelSettings["brandColors"];
  label_size: LabelSettings["labelSize"];
  default_template: LabelSettings["defaultTemplate"];
  order_number_config: LabelSettings["orderNumberConfig"];
};

function rowToLabel(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: row.shipment?.date ?? row.created_at.slice(0, 10),
    sender: row.sender,
    recipient: row.recipient,
    carrier: row.carrier,
    paymentMethod: row.payment_method,
    codAmount: Number(row.cod_amount),
    packageCount: row.package_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pdfUrl: row.pdf_url,
    createdBy: row.created_by,
  };
}

function settingsToRow(settings: LabelSettings) {
  return {
    default_sender: settings.defaultSender,
    logo_url: settings.logoUrl,
    qr_url: settings.qrUrl,
    instagram_user: settings.instagramUser,
    brand_phrase: settings.brandPhrase,
    brand_colors: settings.brandColors,
    label_size: settings.labelSize,
    default_template: settings.defaultTemplate,
    order_number_config: settings.orderNumberConfig,
  };
}

function rowToSettings(row: SettingsRow | null): LabelSettings {
  if (!row) return defaultSettings;
  return {
    defaultSender: row.default_sender,
    logoUrl: row.logo_url,
    qrUrl: row.qr_url,
    instagramUser: row.instagram_user,
    brandPhrase: row.brand_phrase,
    brandColors: row.brand_colors,
    labelSize: row.label_size,
    defaultTemplate: row.default_template,
    orderNumberConfig: row.order_number_config,
  };
}

function labelToRow(draft: LabelDraft, orderNumber: string) {
  return {
    order_number: orderNumber,
    sender: draft.sender,
    recipient: draft.recipient,
    shipment: { date: draft.date },
    payment_method: draft.paymentMethod,
    cod_amount: draft.codAmount,
    package_count: draft.packageCount,
    carrier: draft.carrier,
    status: draft.status === "borrador" ? "generado" : draft.status,
  };
}

function canUseSupabaseStore(): boolean {
  return typeof window !== "undefined" && createClient() !== null;
}

function createSupabaseLabelStore(): LabelStore | null {
  const supabase = createClient();
  if (!supabase) return null;
  return {
    async listLabels() {
      const { data, error } = await supabase.from("labels").select("*").order("created_at", { ascending: false }).returns<LabelRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToLabel);
    },
    async getLabel(id) {
      const { data, error } = await supabase.from("labels").select("*").eq("id", id).maybeSingle<LabelRow>();
      if (error) throw error;
      return data ? rowToLabel(data) : null;
    },
    async saveLabel(draft, settings) {
      const manual = draft.orderNumber.trim();
      if (manual) {
        const { data: duplicates, error: duplicateError } = await supabase
          .from("labels")
          .select("id")
          .eq("order_number", manual)
          .neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000");
        if (duplicateError) throw duplicateError;
        if ((duplicates ?? []).length > 0) throw new Error("duplicate_order_number");
      }
      const orderNumber = manual || await reserveSupabaseOrderNumber(draft, settings);
      const row = labelToRow(draft, orderNumber);
      const request = draft.id
        ? supabase.from("labels").update(row).eq("id", draft.id).select("*").single<LabelRow>()
        : supabase.from("labels").insert(row).select("*").single<LabelRow>();
      const { data, error } = await request;
      if (error) throw error;
      return rowToLabel(data);
    },
    async deleteLabel(id) {
      const { error } = await supabase.from("labels").delete().eq("id", id);
      if (error) throw error;
    },
    async duplicateLabel(id) {
      const label = await this.getLabel(id);
      if (!label) return null;
      return {
        ...createBlankLabelDraft(),
        sender: label.sender,
        recipient: label.recipient,
        carrier: label.carrier,
        paymentMethod: label.paymentMethod,
        codAmount: label.codAmount,
        packageCount: label.packageCount,
      };
    },
    async getSettings() {
      const { data, error } = await supabase.from("settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle<SettingsRow>();
      if (error) throw error;
      return rowToSettings(data ?? null);
    },
    async saveSettings(settings) {
      const { error } = await supabase.from("settings").insert(settingsToRow(settings));
      if (error) throw error;
      return settings;
    },
    async estimateNextOrderNumber(settings, draft) {
      return createLocalLabelStore().estimateNextOrderNumber(settings, draft);
    },
  };
}

async function reserveSupabaseOrderNumber(draft: LabelDraft, settings: LabelSettings): Promise<string> {
  const supabase = createClient();
  if (!supabase) throw new Error("supabase_unavailable");
  const config = settings.orderNumberConfig;
  const date = new Date(`${draft.date}T00:00:00Z`);
  const { data, error } = await supabase.rpc("reserve_order_number", {
    p_scope_key: getSequenceScope(config.resetPolicy, date),
    p_prefix: config.prefix,
    p_suffix: config.suffix,
    p_pattern: config.pattern,
    p_sequence_digits: config.sequenceDigits,
    p_date_format: config.dateFormat,
    p_reset_policy: config.resetPolicy,
    p_label_date: draft.date,
    p_city: draft.recipient.city,
    p_department: draft.recipient.department,
    p_manual_order_number: null,
  });
  if (error) throw error;
  return String(data);
}

function usesBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!usesBrowserStorage()) return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (usesBrowserStorage()) window.localStorage.setItem(key, JSON.stringify(value));
}

function readLabels(): LabelRecord[] {
  return usesBrowserStorage() ? readStorage<LabelRecord[]>(storageKeys.labels, []) : [...memoryLabels];
}

function writeLabels(labels: LabelRecord[]) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.labels, labels);
    return;
  }
  memoryLabels.splice(0, memoryLabels.length, ...labels);
}

function readSettings(): LabelSettings {
  return usesBrowserStorage() ? readStorage<LabelSettings>(storageKeys.settings, defaultSettings) : memorySettings;
}

function writeSettings(settings: LabelSettings) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.settings, settings);
    return;
  }
  memorySettings = settings;
}

function readSequences(): Map<string, number> {
  if (!usesBrowserStorage()) return new Map(memorySequences);
  return new Map(Object.entries(readStorage<Record<string, number>>(storageKeys.sequences, {})));
}

function writeSequences(sequences: Map<string, number>) {
  if (usesBrowserStorage()) {
    writeStorage(storageKeys.sequences, Object.fromEntries(sequences));
    return;
  }
  memorySequences.clear();
  sequences.forEach((value, key) => memorySequences.set(key, value));
}

function toRecord(draft: LabelDraft, existing?: LabelRecord): LabelRecord {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: existing?.id ?? draft.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pdfUrl: existing?.pdfUrl ?? null,
    createdBy: existing?.createdBy ?? null,
  };
}

function getNextSequence(settings: LabelSettings, draft: LabelDraft, sequences: Map<string, number>): { scope: string; value: number } {
  const date = new Date(`${draft.date}T00:00:00Z`);
  const scope = getSequenceScope(settings.orderNumberConfig.resetPolicy, date);
  const currentValue = sequences.get(scope);
  return {
    scope,
    value: currentValue === undefined ? settings.orderNumberConfig.initialSequence : currentValue + 1,
  };
}

export function createLocalLabelStore(): LabelStore {
  return {
    async listLabels() {
      return readLabels().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getLabel(id) {
      return readLabels().find((label) => label.id === id) ?? null;
    },
    async saveLabel(draft, settings) {
      const labels = readLabels();
      const sequences = readSequences();
      const manual = draft.orderNumber.trim();
      if (manual && labels.some((label) => label.orderNumber === manual && label.id !== draft.id)) {
        throw new Error("duplicate_order_number");
      }
      const index = labels.findIndex((label) => label.id === draft.id);
      const existing = index >= 0 ? labels[index] : undefined;
      const nextSequence = manual ? undefined : getNextSequence(settings, draft, sequences);
      const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: nextSequence!.value,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
      if (nextSequence) {
        sequences.set(nextSequence.scope, nextSequence.value);
        writeSequences(sequences);
      }
      const status = existing ? draft.status : draft.status === "borrador" ? "generado" : draft.status;
      const record = toRecord({ ...draft, orderNumber, status }, existing);
      if (index >= 0) labels[index] = record;
      else labels.unshift(record);
      writeLabels(labels);
      return record;
    },
    async deleteLabel(id) {
      writeLabels(readLabels().filter((label) => label.id !== id));
    },
    async duplicateLabel(id) {
      const label = readLabels().find((item) => item.id === id);
      if (!label) return null;
      return {
        ...createBlankLabelDraft(),
        sender: label.sender,
        recipient: label.recipient,
        carrier: label.carrier,
        paymentMethod: label.paymentMethod,
        codAmount: label.codAmount,
        packageCount: label.packageCount,
      };
    },
    async getSettings() {
      return readSettings();
    },
    async saveSettings(settings) {
      writeSettings(settings);
      return settings;
    },
    async estimateNextOrderNumber(settings, draft) {
      const nextSequence = getNextSequence(settings, draft, readSequences());
      return formatOrderNumber(settings.orderNumberConfig, {
        date: new Date(`${draft.date}T00:00:00Z`),
        sequence: nextSequence.value,
        city: draft.recipient.city,
        department: draft.recipient.department,
      });
    },
  };
}

export function getLabelStore(): LabelStore {
  if (canUseSupabaseStore()) return createSupabaseLabelStore() ?? createLocalLabelStore();
  return createLocalLabelStore();
}
