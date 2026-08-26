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
const HEADER_HEIGHT = 160;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLUMNS = 3;
const CARD_GAP = 14;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (COLUMNS - 1)) / COLUMNS;
const PHOTO_HEIGHT = CARD_WIDTH * 0.8;
const CARD_HEIGHT = PHOTO_HEIGHT + 46;

const PURPLE_900 = rgb(0.298, 0.114, 0.584);
const PURPLE_600 = rgb(0.486, 0.227, 0.929);
const PURPLE_100 = rgb(0.929, 0.914, 0.996);
const PURPLE_50 = rgb(0.961, 0.953, 1);
const BORDER = rgb(0.894, 0.875, 0.949);
const TEXT_COLOR = rgb(0.086, 0.071, 0.122);
const MUTED_COLOR = rgb(0.388, 0.365, 0.447);
const WHITE = rgb(1, 1, 1);

function sanitize(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
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

function drawCoverHeader(ctx: PdfContext, settings: LabelSettings): PdfContext {
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT, color: PURPLE_600 });

  const logoSize = 56;
  const logoY = PAGE_HEIGHT - HEADER_HEIGHT / 2 - logoSize / 2;
  if (ctx.logo) ctx.page.drawImage(ctx.logo, { x: MARGIN, y: logoY, width: logoSize, height: logoSize });

  const textX = MARGIN + (ctx.logo ? logoSize + 16 : 0);
  ctx.page.drawText("CATALOGO", { x: textX, y: PAGE_HEIGHT - 52, size: 22, font: ctx.boldFont, color: WHITE });
  ctx.page.drawText(sanitize(settings.brandPhrase).toUpperCase(), { x: textX, y: PAGE_HEIGHT - 74, size: 10, font: ctx.font, color: PURPLE_100 });

  const contactLines = [
    settings.defaultSender.phone ? `WhatsApp: ${settings.defaultSender.phone}` : "",
    settings.instagramUser ? `Instagram: ${settings.instagramUser}` : "",
    settings.facebookUser ? `Facebook: ${settings.facebookUser}` : "",
    settings.tiktokUser ? `TikTok: ${settings.tiktokUser}` : "",
    settings.email ? `Correo: ${settings.email}` : "",
  ].filter(Boolean);

  let contactY = PAGE_HEIGHT - HEADER_HEIGHT + 34;
  for (const line of contactLines) {
    ctx.page.drawText(sanitize(line), { x: textX, y: contactY, size: 9.5, font: ctx.font, color: WHITE });
    contactY -= 15;
  }

  return { ...ctx, y: PAGE_HEIGHT - HEADER_HEIGHT - 30, column: 0 };
}

function drawCategoryTitle(ctx: PdfContext, category: string): PdfContext {
  let next = ctx;
  if (next.column !== 0) next = { ...newPage(next), column: 0 };
  if (next.y - 26 < MARGIN) next = newPage(next);
  next.page.drawText(sanitize(category || "OTROS"), { x: MARGIN, y: next.y - 16, size: 13, font: next.boldFont, color: PURPLE_900 });
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
    color: PURPLE_900,
  });

  const column = (next.column + 1) % COLUMNS;
  const y = column === 0 ? next.y - CARD_HEIGHT - CARD_GAP : next.y;
  return { ...next, column, y };
}

export async function renderCatalogPdfBuffer(products: ProductCode[], settings: LabelSettings): Promise<Buffer> {
  const base = await createContext();
  let ctx = drawCoverHeader(newPage(base), settings);

  const groups = groupProductCodesByCategory(products);
  if (groups.length === 0) {
    ctx.page.drawText("Aun no hay productos en el catalogo.", { x: MARGIN, y: ctx.y - 14, size: 11, font: ctx.font, color: MUTED_COLOR });
  }

  for (const group of groups) {
    ctx = drawCategoryTitle(ctx, group.category);
    for (const product of group.products) {
      ctx = await drawProductCard(ctx, product);
    }
    if (ctx.column !== 0) ctx = { ...ctx, column: 0, y: ctx.y - CARD_HEIGHT - CARD_GAP };
  }

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}
