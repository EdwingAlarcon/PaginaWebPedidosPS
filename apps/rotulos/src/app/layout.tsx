import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PurpleShop",
  description: "Gestion de pedidos, clientes y rotulos de envio para PurpleShop",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={plusJakartaSans.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
