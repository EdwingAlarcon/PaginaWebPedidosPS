import type { MetadataRoute } from "next";

// Publico a proposito: excluido del matcher de src/proxy.ts porque el navegador
// pide el manifest sin cookies de sesion.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Purple Shop - Sistema de gestión",
    short_name: "Purple Shop",
    description: "Gestión de pedidos, clientes y rótulos de envío para PurpleShop",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0b17",
    theme_color: "#0f0b17",
    lang: "es-CO",
    icons: [
      { src: "/purple-shop-logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/purple-shop-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo pedido", url: "/pedidos/nuevo" },
      { name: "Despacho", url: "/despacho" },
    ],
  };
}
