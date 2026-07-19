export type PaymentMethod = "pagado" | "contraentrega";
export type LabelStatus = "borrador" | "generado" | "impreso" | "anulado";
export type ResetPolicy = "never" | "daily" | "monthly" | "annual";
export type DateFormat = "YYYY" | "YYYYMM" | "YYYYMMDD";

export type LabelSize = "10x9" | "14x12";

export const LABEL_SIZES: Record<LabelSize, { widthCm: number; heightCm: number; label: string }> = {
  "10x9": { widthCm: 10, heightCm: 9, label: "Pequeno (10 x 9 cm)" },
  "14x12": { widthCm: 14, heightCm: 12, label: "Grande (14 x 12 cm)" },
};

export const DEFAULT_LABEL_SIZE: LabelSize = "14x12";

export type Sender = {
  name: string;
  phone: string;
  department: string;
  city: string;
  locality?: string;
  neighborhood?: string;
  address: string;
};

export type Recipient = {
  fullName: string;
  phone: string;
  department: string;
  city: string;
  locality?: string;
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
  size: LabelSize;
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
