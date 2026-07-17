import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";

describe("createMiddlewareSupabaseClient", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("retorna supabase null si faltan las variables de entorno", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const request = new NextRequest("http://localhost/pedidos");

    const { supabase, response } = createMiddlewareSupabaseClient(request);

    expect(supabase).toBeNull();
    expect(response).toBeDefined();
  });

  it("crea un cliente cuando las variables de entorno existen", () => {
    const request = new NextRequest("http://localhost/pedidos");

    const { supabase } = createMiddlewareSupabaseClient(request);

    expect(supabase).not.toBeNull();
  });
});
