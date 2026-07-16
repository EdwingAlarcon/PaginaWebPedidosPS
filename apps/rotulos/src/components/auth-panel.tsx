"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState(hasSupabaseEnv() ? "Verificando sesion..." : "Modo local de desarrollo");
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
      setStatus(data.user ? "Sesion activa" : "Inicia sesion para guardar en Supabase");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? "");
      setStatus(session ? "Sesion activa" : "Inicia sesion para guardar en Supabase");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setStatus("Enviando enlace...");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setStatus(error ? "No se pudo enviar el enlace" : "Revisa tu correo para entrar");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail("");
    setStatus("Sesion cerrada");
  }

  if (!supabase) {
    return <div className="auth-panel"><span>{status}</span></div>;
  }

  if (userEmail) {
    return (
      <div className="auth-panel">
        <span>{userEmail}</span>
        <button type="button" onClick={signOut}>Salir</button>
      </div>
    );
  }

  return (
    <form className="auth-panel" onSubmit={sendMagicLink}>
      <span>{status}</span>
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" aria-label="Correo" />
      <button type="submit">Entrar</button>
    </form>
  );
}
