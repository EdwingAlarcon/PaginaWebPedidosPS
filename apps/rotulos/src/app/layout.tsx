import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    { media: "(prefers-color-scheme: dark)", color: "#0f0b17" },
    { media: "(prefers-color-scheme: light)", color: "#f8f7fb" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
