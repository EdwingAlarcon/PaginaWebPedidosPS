"use client";

import { formatCop } from "@/lib/format";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

const WIDTH = 720;
const MARGIN = 28;
const HEADER_HEIGHT = 150;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const COLUMNS = 2;
const CARD_GAP = 16;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (COLUMNS - 1)) / COLUMNS;
const PHOTO_HEIGHT = CARD_WIDTH * 0.8;
const CARD_HEIGHT = PHOTO_HEIGHT + 56;
const EXPORT_SCALE = 2;

const COLORS = {
  purple900: "#4C1D95",
  purple600: "#7C3AED",
  purple100: "#EDE9FE",
  purple50: "#F5F3FF",
  border: "#E4DFF2",
  text: "#16121F",
  muted: "#635D72",
  white: "#FFFFFF",
};

const FONT_FAMILY = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const boldFont = (size: number) => `700 ${size}px ${FONT_FAMILY}`;
const regularFont = (size: number) => `400 ${size}px ${FONT_FAMILY}`;

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function computeHeight(products: ProductCode[]): number {
  const groups = groupProductCodesByCategory(products);
  let height = HEADER_HEIGHT + 30;
  for (const group of groups) {
    height += 34;
    const rows = Math.ceil(group.products.length / COLUMNS);
    height += rows * (CARD_HEIGHT + CARD_GAP);
  }
  return Math.max(height, HEADER_HEIGHT + 80);
}

export async function renderCatalogImage(products: ProductCode[], settings: LabelSettings): Promise<Blob> {
  const height = computeHeight(products);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = COLORS.purple600;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  ctx.fillStyle = COLORS.white;
  ctx.font = boldFont(24);
  ctx.textAlign = "left";
  ctx.fillText("CATALOGO", MARGIN, 46);
  ctx.font = regularFont(11);
  ctx.fillText(settings.brandPhrase.toUpperCase(), MARGIN, 68);

  const contactLines = [
    settings.defaultSender.phone ? `WhatsApp: ${settings.defaultSender.phone}` : "",
    settings.instagramUser ? `Instagram: ${settings.instagramUser}` : "",
    settings.facebookUser ? `Facebook: ${settings.facebookUser}` : "",
    settings.tiktokUser ? `TikTok: ${settings.tiktokUser}` : "",
    settings.email ? `Correo: ${settings.email}` : "",
  ].filter(Boolean);
  let contactY = 92;
  for (const line of contactLines) {
    ctx.fillText(line, MARGIN, contactY);
    contactY += 16;
  }

  let y = HEADER_HEIGHT + 30;
  const groups = groupProductCodesByCategory(products);

  if (groups.length === 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = regularFont(13);
    ctx.fillText("Aun no hay productos en el catalogo.", MARGIN, y);
  }

  for (const group of groups) {
    ctx.fillStyle = COLORS.purple900;
    ctx.font = boldFont(15);
    ctx.fillText(group.category || "OTROS", MARGIN, y);
    y += 24;

    for (let index = 0; index < group.products.length; index += 1) {
      const product = group.products[index];
      const column = index % COLUMNS;
      if (column === 0 && index > 0) y += CARD_HEIGHT + CARD_GAP;
      const cardX = MARGIN + column * (CARD_WIDTH + CARD_GAP);
      const cardTop = y;

      ctx.fillStyle = COLORS.purple50;
      ctx.strokeStyle = COLORS.border;
      ctx.fillRect(cardX, cardTop, CARD_WIDTH, CARD_HEIGHT);
      ctx.strokeRect(cardX, cardTop, CARD_WIDTH, CARD_HEIGHT);

      const image = await loadImage(product.imageUrl);
      const photoY = cardTop + 8;
      if (image) {
        const scale = Math.min(CARD_WIDTH / image.width, PHOTO_HEIGHT / image.height);
        const width = image.width * scale;
        const drawHeight = image.height * scale;
        ctx.drawImage(image, cardX + (CARD_WIDTH - width) / 2, photoY + (PHOTO_HEIGHT - drawHeight) / 2, width, drawHeight);
      } else {
        ctx.fillStyle = COLORS.purple100;
        ctx.fillRect(cardX + 6, photoY, CARD_WIDTH - 12, PHOTO_HEIGHT);
        ctx.fillStyle = COLORS.muted;
        ctx.font = regularFont(10);
        ctx.textAlign = "center";
        ctx.fillText("SIN FOTO", cardX + CARD_WIDTH / 2, photoY + PHOTO_HEIGHT / 2);
        ctx.textAlign = "left";
      }

      ctx.fillStyle = COLORS.text;
      ctx.font = boldFont(12);
      const name = product.productName.length > 30 ? `${product.productName.slice(0, 30)}...` : product.productName;
      ctx.fillText(name, cardX + 10, photoY + PHOTO_HEIGHT + 20);
      ctx.fillStyle = COLORS.purple900;
      ctx.font = boldFont(13);
      ctx.fillText(formatCop(product.unitPrice), cardX + 10, photoY + PHOTO_HEIGHT + 40);
    }
    y += CARD_HEIGHT + CARD_GAP;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob_failed"));
    }, "image/png");
  });
}
