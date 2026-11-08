import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fredoka: tipografia de titulos de la marca (manual v2). El texto y los datos siguen en Inter.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PurpleShop",
  description: "Gestión de pedidos, clientes y rótulos de envío para PurpleShop",
  applicationName: "Purple Shop",
  appleWebApp: { capable: true, title: "Purple Shop", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#150a20" },
    { media: "(prefers-color-scheme: light)", color: "#fbf7fd" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${fredoka.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
