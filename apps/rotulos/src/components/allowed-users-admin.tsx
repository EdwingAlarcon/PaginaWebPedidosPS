"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type AllowedUser = { email: string; created_at: string };
type AllowedUsersResponse = { users: AllowedUser[]; currentUserEmail: string | null } | null;

async function fetchAllowedUsers(): Promise<AllowedUsersResponse> {
  const response = await fetch("/api/allowed-users");
  if (!response.ok) return null;
  const body = await response.json();
  return { users: body.users ?? [], currentUserEmail: body.currentUserEmail ?? null };
}

export function AllowedUsersAdmin() {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    void fetchAllowedUsers().then((result) => {
      if (!active) return;
      if (!result) {
        toast.push({ variant: "danger", title: "No se pudo cargar la lista de usuarios." });
      } else {
        setUsers(result.users);
        setCurrentUserEmail(result.currentUserEmail);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [toast]);

  async function reloadUsers() {
    const result = await fetchAllowedUsers();
    if (result) {
      setUsers(result.users);
      setCurrentUserEmail(result.currentUserEmail);
    }
  }

  async function addUser() {
    if (!email.trim() || adding) return;
    setAdding(true);
    try {
      const response = await fetch("/api/allowed-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        toast.push({ variant: "danger", title: "No se pudo agregar el correo. Revisa el formato." });
        return;
      }
      setEmail("");
      toast.push({ variant: "success", title: "Usuario agregado." });
      await reloadUsers();
    } finally {
      setAdding(false);
    }
  }

  async function removeUser(target: string) {
    setDeleting(true);
    try {
      const response = await fetch(`/api/allowed-users?email=${encodeURIComponent(target)}`, { method: "DELETE" });
      if (!response.ok) {
        toast.push({ variant: "danger", title: "No se pudo eliminar el usuario." });
        return;
      }
      toast.push({ variant: "success", title: "Usuario eliminado." });
      await reloadUsers();
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-card-title">Usuarios permitidos</h2>
        <p className="text-sm text-foreground-muted">
          Solo los correos de esta lista pueden iniciar sesion en el sistema.
        </p>
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void addUser();
        }}
      >
        <FormField label="Correo" className="flex-1">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@ejemplo.com"
          />
        </FormField>
        <Button type="submit" loading={adding}>
          Agregar
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-foreground-muted">Cargando...</p>
      ) : (
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <li key={user.email} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-foreground">{user.email}</span>
              {user.email !== currentUserEmail ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(user.email)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Eliminar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar usuario"
        description={pendingDelete ? `${pendingDelete} ya no podra iniciar sesion.` : undefined}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={() => {
          if (pendingDelete) void removeUser(pendingDelete);
        }}
      />
    </Card>
  );
}
