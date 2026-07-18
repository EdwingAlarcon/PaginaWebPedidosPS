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
    <div className="w-full max-w-[440px] rounded-lg border border-border bg-surface p-8 shadow-card">
      <h2 className="text-section-title">Bienvenido de vuelta</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Inicia sesion con tu cuenta de Microsoft para continuar.
      </p>

      <div className="mt-6">
        {!hasSupabaseEnv() ? (
          <Alert variant="danger">La aplicacion no tiene configurada la conexion con la base de datos.</Alert>
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
          <Alert variant="danger">No se pudo iniciar sesion. Intenta de nuevo.</Alert>
        </div>
      ) : null}

      {status === "unauthorized" ? (
        <div className="mt-4">
          <Alert variant="warning">Esta cuenta no tiene acceso a PurpleShop.</Alert>
        </div>
      ) : null}

      <p className="mt-5 text-center text-xs text-foreground-muted">
        Acceso restringido a cuentas autorizadas de PurpleShop.
      </p>
    </div>
  );
}
