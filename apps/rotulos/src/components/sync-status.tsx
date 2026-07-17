"use client";

import { useEffect, useState } from "react";

type ConnectionState = "online" | "offline";

export function SyncStatus() {
  const [state, setState] = useState<ConnectionState>(() =>
    navigator.onLine ? "online" : "offline"
  );

  useEffect(() => {
    const handleOnline = () => setState("online");
    const handleOffline = () => setState("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const label = state === "online" ? "Todo al dia" : "Sin conexion";

  return (
    <span className="sync-status" data-state={state} title={label}>
      <span className="sync-status-dot" aria-hidden="true" />
      <span className="sync-status-label">{label}</span>
    </span>
  );
}
