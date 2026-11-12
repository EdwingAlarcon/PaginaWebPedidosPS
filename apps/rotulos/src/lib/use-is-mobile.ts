"use client";

import { useSyncExternalStore } from "react";

// Mismo corte que el breakpoint `sm` de Tailwind: por debajo de 640px las
// tablas se muestran como tarjetas para no obligar a deslizar hacia el lado.
const QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
