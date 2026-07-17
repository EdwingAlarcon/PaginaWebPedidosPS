import type { LabelDraft, LabelSettings, OrderNumberConfig } from "@/lib/types";
import { DEFAULT_LABEL_SIZE } from "@/lib/types";

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
    size: DEFAULT_LABEL_SIZE,
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
