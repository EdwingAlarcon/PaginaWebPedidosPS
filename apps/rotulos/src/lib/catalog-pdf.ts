import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { formatCop } from "@/lib/format";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLUMNS = 3;
const CARD_GAP = 14;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (COLUMNS - 1)) / COLUMNS;
const PHOTO_HEIGHT = CARD_WIDTH * 0.8;
const CARD_HEIGHT = PHOTO_HEIGHT + 46;
const BRAND_STRIP_HEIGHT = 34;

const PURPLE_900: [number, number, number] = [0.298, 0.114, 0.584];
const PURPLE_600: [number, number, number] = [0.486, 0.227, 0.929];
const PURPLE_100 = rgb(0.929, 0.914, 0.996);
const PURPLE_50 = rgb(0.961, 0.953, 1);
const BORDER = rgb(0.894, 0.875, 0.949);
const TEXT_COLOR = rgb(0.086, 0.071, 0.122);
const MUTED_COLOR = rgb(0.388, 0.365, 0.447);
const WHITE = rgb(1, 1, 1);

const COVER_TOP: [number, number, number] = [0.176, 0.055, 0.373];
const HOMBRE_TOP: [number, number, number] = [0.169, 0.157, 0.42];
const MUJER_TOP: [number, number, number] = [0.827, 0.145, 0.435];

const CATEGORY_DISPLAY: Record<string, { label: string; top: [number, number, number] }> = {
  HOMBRE: { label: "HOMBRES", top: HOMBRE_TOP },
  MUJER: { label: "MUJERES", top: MUJER_TOP },
};

function sanitize(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
}

function tracked(value: string): string {
  return value.split("").join(" ");
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawVerticalGradient(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  top: [number, number, number],
  bottom: [number, number, number],
  steps = 48,
): void {
  const bandHeight = height / steps;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const color = rgb(lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t));
    page.drawRectangle({ x, y: y + height - (i + 1) * bandHeight, width, height: bandHeight + 0.5, color });
  }
}

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  logo: PDFImage | null;
  y: number;
  column: number;
};

async function createContext(): Promise<Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">> {
  const doc = await PDFDocument.create();
  const [font, boldFont] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold)]);
  let logo: PDFImage | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "purple-shop-logo.png"));
    logo = await doc.embedPng(bytes);
  } catch {
    logo = null;
  }
  return { doc, font, boldFont, logo };
}

function isAllowedProductImageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/product-images/`;
  return url.startsWith(prefix);
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  if (!isAllowedProductImageUrl(url)) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

async function embedProductImage(doc: PDFDocument, url: string | null): Promise<PDFImage | null> {
  if (!url) return null;
  const bytes = await fetchImageBytes(url);
  if (!bytes) return null;
  const isPng = bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  try {
    return isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

function newPage(ctx: Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">): PdfContext {
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...ctx, page, y: PAGE_HEIGHT - MARGIN, column: 0 };
}

function drawCoverPage(base: Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">, settings: LabelSettings): void {
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawVerticalGradient(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, COVER_TOP, PURPLE_600);

  page.drawCircle({ x: PAGE_WIDTH - 60, y: PAGE_HEIGHT - 90, size: 140, color: WHITE, opacity: 0.06 });
  page.drawCircle({ x: 40, y: 170, size: 100, color: WHITE, opacity: 0.07 });
  page.drawCircle({ x: PAGE_WIDTH - 40, y: 260, size: 40, color: WHITE, opacity: 0.1 });

  const centerX = PAGE_WIDTH / 2;
  const logoCenterY = PAGE_HEIGHT - 300;
  page.drawCircle({ x: centerX, y: logoCenterY, size: 78, color: WHITE, opacity: 0.14 });
  if (base.logo) {
    const logoSize = 100;
    page.drawImage(base.logo, { x: centerX - logoSize / 2, y: logoCenterY - logoSize / 2, width: logoSize, height: logoSize });
  }

  const title = "CATALOGO";
  const titleSize = 40;
  const titleWidth = base.boldFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, { x: centerX - titleWidth / 2, y: logoCenterY - 130, size: titleSize, font: base.boldFont, color: WHITE });

  const subtitle = tracked(sanitize(settings.brandPhrase).toUpperCase());
  const subtitleSize = 12;
  const subtitleWidth = base.font.widthOfTextAtSize(subtitle, subtitleSize);
  page.drawText(subtitle, { x: centerX - subtitleWidth / 2, y: logoCenterY - 156, size: subtitleSize, font: base.font, color: rgb(0.929, 0.914, 0.996) });

  page.drawRectangle({ x: centerX - 60, y: logoCenterY - 180, width: 120, height: 1.5, color: WHITE, opacity: 0.5 });

  const contactLines = [
    settings.defaultSender.phone ? `WhatsApp: ${settings.defaultSender.phone}` : "",
    settings.instagramUser ? `Instagram: ${settings.instagramUser}` : "",
    settings.facebookUser ? `Facebook: ${settings.facebookUser}` : "",
    settings.tiktokUser ? `TikTok: ${settings.tiktokUser}` : "",
    settings.email ? `Correo: ${settings.email}` : "",
  ].filter(Boolean);

  if (contactLines.length > 0) {
    const cardWidth = 260;
    const cardHeight = 24 + contactLines.length * 18;
    const cardY = 100;
    page.drawRectangle({ x: centerX - cardWidth / 2, y: cardY, width: cardWidth, height: cardHeight, color: WHITE, opacity: 0.1 });
    let lineY = cardY + cardHeight - 26;
    for (const line of contactLines) {
      const clean = sanitize(line);
      const width = base.font.widthOfTextAtSize(clean, 10.5);
      page.drawText(clean, { x: centerX - width / 2, y: lineY, size: 10.5, font: base.font, color: WHITE });
      lineY -= 18;
    }
  }
}

function drawCategoryDividerPage(base: Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">, category: string): void {
  const meta = CATEGORY_DISPLAY[category.trim().toUpperCase()] ?? { label: sanitize(category) || "OTROS", top: PURPLE_900 };
  const page = base.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawVerticalGradient(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, meta.top, PURPLE_600);

  page.drawCircle({ x: PAGE_WIDTH / 2, y: PAGE_HEIGHT / 2 + 20, size: 170, color: WHITE, opacity: 0.05 });
  page.drawCircle({ x: PAGE_WIDTH / 2, y: PAGE_HEIGHT / 2 + 20, size: 120, color: WHITE, opacity: 0.06 });

  if (base.logo) {
    const logoSize = 34;
    page.drawImage(base.logo, { x: MARGIN, y: PAGE_HEIGHT - MARGIN - logoSize, width: logoSize, height: logoSize });
  }

  const eyebrow = tracked("COLECCION PURPLE SHOP");
  const eyebrowSize = 11;
  const eyebrowWidth = base.font.widthOfTextAtSize(eyebrow, eyebrowSize);
  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;
  page.drawText(eyebrow, { x: centerX - eyebrowWidth / 2, y: centerY + 46, size: eyebrowSize, font: base.font, color: rgb(0.929, 0.914, 0.996) });

  const titleSize = 46;
  const titleWidth = base.boldFont.widthOfTextAtSize(meta.label, titleSize);
  page.drawText(meta.label, { x: centerX - titleWidth / 2, y: centerY - 10, size: titleSize, font: base.boldFont, color: WHITE });

  page.drawRectangle({ x: centerX - 50, y: centerY - 34, width: 100, height: 1.5, color: WHITE, opacity: 0.5 });
}

function drawBrandStrip(ctx: PdfContext): PdfContext {
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - BRAND_STRIP_HEIGHT, width: PAGE_WIDTH, height: BRAND_STRIP_HEIGHT, color: PURPLE_50 });
  if (ctx.logo) {
    const logoSize = 18;
    ctx.page.drawImage(ctx.logo, { x: MARGIN, y: PAGE_HEIGHT - BRAND_STRIP_HEIGHT / 2 - logoSize / 2, width: logoSize, height: logoSize });
  }
  const label = "PURPLE SHOP";
  ctx.page.drawText(label, {
    x: MARGIN + (ctx.logo ? 24 : 0),
    y: PAGE_HEIGHT - BRAND_STRIP_HEIGHT / 2 - 3,
    size: 9,
    font: ctx.boldFont,
    color: rgb(PURPLE_900[0], PURPLE_900[1], PURPLE_900[2]),
  });
  return { ...ctx, y: PAGE_HEIGHT - BRAND_STRIP_HEIGHT - 16 };
}

function drawCategoryTitle(ctx: PdfContext, category: string): PdfContext {
  let next = ctx;
  if (next.column !== 0) next = { ...newPage(next), column: 0 };
  if (next.y - 26 < MARGIN) next = newPage(next);
  const meta = CATEGORY_DISPLAY[category.trim().toUpperCase()];
  next.page.drawText(sanitize(meta?.label ?? category) || "OTROS", {
    x: MARGIN,
    y: next.y - 16,
    size: 13,
    font: next.boldFont,
    color: rgb(PURPLE_900[0], PURPLE_900[1], PURPLE_900[2]),
  });
  return { ...next, y: next.y - 30, column: 0 };
}

async function drawProductCard(ctx: PdfContext, product: ProductCode): Promise<PdfContext> {
  let next = ctx;
  if (next.y - CARD_HEIGHT < MARGIN) next = { ...newPage(next), column: 0 };

  const cardX = MARGIN + next.column * (CARD_WIDTH + CARD_GAP);
  const cardTop = next.y;

  next.page.drawRectangle({
    x: cardX,
    y: cardTop - CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    color: PURPLE_50,
    borderColor: BORDER,
    borderWidth: 1,
  });

  const image = await embedProductImage(next.doc, product.imageUrl);
  const photoY = cardTop - PHOTO_HEIGHT - 6;
  if (image) {
    const scale = Math.min(CARD_WIDTH / image.width, PHOTO_HEIGHT / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    next.page.drawImage(image, { x: cardX + (CARD_WIDTH - width) / 2, y: photoY + (PHOTO_HEIGHT - height) / 2, width, height });
  } else {
    next.page.drawRectangle({ x: cardX + 6, y: photoY, width: CARD_WIDTH - 12, height: PHOTO_HEIGHT, color: PURPLE_100 });
    const label = "SIN FOTO";
    const width = next.font.widthOfTextAtSize(label, 8);
    next.page.drawText(label, { x: cardX + (CARD_WIDTH - width) / 2, y: photoY + PHOTO_HEIGHT / 2 - 3, size: 8, font: next.font, color: MUTED_COLOR });
  }

  const name = sanitize(product.productName);
  next.page.drawText(name.length > 26 ? `${name.slice(0, 26)}...` : name, {
    x: cardX + 8,
    y: cardTop - CARD_HEIGHT + 28,
    size: 9.5,
    font: next.boldFont,
    color: TEXT_COLOR,
  });
  next.page.drawText(formatCop(product.unitPrice), {
    x: cardX + 8,
    y: cardTop - CARD_HEIGHT + 12,
    size: 10,
    font: next.boldFont,
    color: rgb(PURPLE_900[0], PURPLE_900[1], PURPLE_900[2]),
  });

  const column = (next.column + 1) % COLUMNS;
  const y = column === 0 ? next.y - CARD_HEIGHT - CARD_GAP : next.y;
  return { ...next, column, y };
}

export async function renderCatalogPdfBuffer(products: ProductCode[], settings: LabelSettings): Promise<Buffer> {
  const base = await createContext();
  drawCoverPage(base, settings);

  const groups = groupProductCodesByCategory(products);

  if (groups.length === 0) {
    let ctx = drawBrandStrip(newPage(base));
    ctx.page.drawText("Aun no hay productos en el catalogo.", { x: MARGIN, y: ctx.y - 14, size: 11, font: ctx.font, color: MUTED_COLOR });
  }

  for (const group of groups) {
    drawCategoryDividerPage(base, group.category);
    let ctx = drawBrandStrip(newPage(base));
    ctx = drawCategoryTitle(ctx, group.category);
    for (const product of group.products) {
      ctx = await drawProductCard(ctx, product);
    }
  }

  const bytes = await base.doc.save();
  return Buffer.from(bytes);
}
