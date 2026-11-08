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
    background_color: "#2a0f3d",
    theme_color: "#6e1593",
    lang: "es-CO",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo pedido", url: "/pedidos/nuevo" },
      { name: "Despacho", url: "/despacho" },
      { name: "Asignar guías", url: "/guias" },
    ],
    // Android: "Compartir -> Purple Shop" desde la pagina del comprobante de la
    // transportadora abre /guias con el texto compartido.
    share_target: {
      action: "/guias",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
