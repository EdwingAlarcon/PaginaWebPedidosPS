"use client";

import { useState } from "react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type LoginStatus = "idle" | "loading" | "error" | "unauthorized";

export function LoginCard({ initialUnauthorized }: { initialUnauthorized: boolean }) {
  const [status, setStatus] = useState<LoginStatus>(initialUnauthorized ? "unauthorized" : "idle");
  const supabase = createClient();

  async function signInWithMicrosoft() {
    if (!supabase) return;
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setStatus("error");
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.01em] text-foreground">
        Inicia sesión
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Accede con tu cuenta Microsoft autorizada para continuar.
      </p>

      <div className="mt-6">
        {!hasSupabaseEnv() ? (
          <Alert variant="danger">La aplicación no tiene configurada la conexión con la base de datos.</Alert>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={signInWithMicrosoft}
            disabled={status === "loading"}
            loading={status === "loading"}
          >
            {status !== "loading" && (
              <img src="/microsoft-logo.svg" alt="" width={18} height={18} aria-hidden="true" className="size-[18px]" />
            )}
            {status === "loading" ? "Conectando..." : "Continuar con Microsoft"}
          </Button>
        )}
      </div>

      {status === "error" ? (
        <div className="mt-4">
          <Alert variant="danger">No se pudo iniciar sesión. Intenta de nuevo.</Alert>
        </div>
      ) : null}

      {status === "unauthorized" ? (
        <div className="mt-4">
          <Alert variant="warning">Esta cuenta no tiene acceso a PurpleShop.</Alert>
        </div>
      ) : null}

      <p className="mt-5 text-center text-xs font-medium text-foreground-muted">
        Acceso exclusivo para personal autorizado de PurpleShop.
      </p>
    </div>
  );
}
