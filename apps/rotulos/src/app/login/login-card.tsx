"use client";

import { useState } from "react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

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
    <div className="login-card">
      <h2 className="text-section-title">Bienvenido de vuelta</h2>
      <p className="login-card-subtitle">Inicia sesion con tu cuenta de Microsoft para continuar.</p>

      {!hasSupabaseEnv() ? (
        <p className="login-card-error" role="alert">
          La aplicacion no tiene configurada la conexion con la base de datos.
        </p>
      ) : (
        <button
          type="button"
          className="login-microsoft-btn"
          onClick={signInWithMicrosoft}
          disabled={status === "loading"}
        >
          <img src="/microsoft-logo.svg" alt="" width={20} height={20} aria-hidden="true" />
          {status === "loading" ? "Conectando..." : "Continuar con Microsoft"}
        </button>
      )}

      {status === "error" ? (
        <p className="login-card-error" role="alert">
          No se pudo iniciar sesion. Intenta de nuevo.
        </p>
      ) : null}

      {status === "unauthorized" ? (
        <p className="login-card-error" role="alert">
          Esta cuenta no tiene acceso a PurpleShop.
        </p>
      ) : null}

      <p className="login-card-notice">Acceso restringido a cuentas autorizadas de PurpleShop.</p>
    </div>
  );
}
