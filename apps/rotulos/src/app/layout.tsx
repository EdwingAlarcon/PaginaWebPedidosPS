import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PurpleShop Rotulos",
  description: "Generador de rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
