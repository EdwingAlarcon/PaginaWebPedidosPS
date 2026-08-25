"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Solo se permiten fotos JPG o PNG.";
  if (file.size > MAX_BYTES) return "La foto no puede pesar mas de 5MB.";
  return null;
}

export async function uploadProductImage(productCodeId: string, file: File): Promise<string> {
  const error = validateProductImageFile(file);
  if (error) throw new Error(error);

  const supabase = createClient();
  if (!supabase) throw new Error("supabase_unavailable");

  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `${productCodeId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
