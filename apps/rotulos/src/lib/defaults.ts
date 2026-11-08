import type { LabelDraft, LabelSettings, OrderNumberConfig } from "@/lib/types";
import { businessToday } from "@/lib/date";
import { DEFAULT_LABEL_SIZE, LABEL_SIZES } from "@/lib/types";

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
    locality: "",
    neighborhood: "",
    address: "",
  },
  logoUrl: "/purple-shop-logo.png",
  qrUrl: "/purple-shop-qr.png",
  instagramUser: "@PURPLESHOP.ONLINE",
  facebookUser: "",
  tiktokUser: "",
  email: "",
  brandPhrase: "Detalles que viajan con amor",
  brandColors: {
    primary: "#6E1593",
    dark: "#2A0F3D",
    light: "#D9B8F0",
    paper: "#F5F5F7",
    ink: "#111111",
  },
  labelSize: {
    widthCm: LABEL_SIZES[DEFAULT_LABEL_SIZE].widthCm,
    heightCm: LABEL_SIZES[DEFAULT_LABEL_SIZE].heightCm,
  },
  defaultTemplate: "purpleshop-classic",
  orderNumberConfig: defaultOrderNumberConfig,
};

export function createBlankLabelDraft(): LabelDraft {
  return {
    orderNumber: "",
    size: DEFAULT_LABEL_SIZE,
    date: businessToday(),
    sender: { ...defaultSettings.defaultSender },
    recipient: {
      fullName: "",
      phone: "",
      department: "",
      city: "",
      locality: "",
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
