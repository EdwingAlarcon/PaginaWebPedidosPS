import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3001";
const outputDir = path.resolve("qa-artifacts");
const breakpoints = [
  { name: "xs-320", width: 320, height: 900 },
  { name: "sm-375", width: 375, height: 900 },
  { name: "md-768", width: 768, height: 900 },
  { name: "lg-1024", width: 1024, height: 900 },
  { name: "xl-1280", width: 1280, height: 900 },
  { name: "2xl-1440", width: 1440, height: 900 },
];
const routes = ["/", "/crear", "/historial", "/configuracion"];

function luminance(rgb) {
  const values = rgb.match(/rgba?\(([^)]+)\)/)?.[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number(part.trim())) ?? [0, 0, 0];
  const [r, g, b] = values.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

async function auditRoute(page, viewport, route) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(route, { waitUntil: "networkidle" });

  const pageAudit = await page.evaluate(() => {
    const isVisible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const isContainedByHorizontalScroller = (el) => {
      let current = el.parentElement;
      while (current && current !== document.body) {
        const style = getComputedStyle(current);
        const scrolls = ["auto", "scroll"].includes(style.overflowX) && current.scrollWidth > current.clientWidth;
        if (scrolls) return true;
        current = current.parentElement;
      }
      return false;
    };

    const visibleElements = Array.from(document.querySelectorAll("body *")).filter(isVisible);
    const overflowElements = visibleElements
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return (rect.left < -2 || rect.right > window.innerWidth + 2) && !isContainedByHorizontalScroller(el);
      })
      .slice(0, 10)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          className: String(el.className),
          text: el.textContent?.trim().slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });

    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || !isVisible(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (textNodes.length < 260) {
      const node = walker.nextNode();
      if (!node) break;
      const el = node.parentElement;
      const style = getComputedStyle(el);
      let background = style.backgroundColor;
      let current = el;
      while ((background === "transparent" || background === "rgba(0, 0, 0, 0)") && current.parentElement) {
        current = current.parentElement;
        background = getComputedStyle(current).backgroundColor;
      }
      if (background === "transparent" || background === "rgba(0, 0, 0, 0)") background = "rgb(255, 255, 255)";
      textNodes.push({
        text: node.textContent.trim().slice(0, 100),
        tag: el.tagName.toLowerCase(),
        className: String(el.className),
        color: style.color,
        background,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
      });
    }

    const interactiveElements = visibleElements.filter((el) =>
      el.matches("a, button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1'])"),
    );
    const boxes = interactiveElements
      .map((el, index) => ({ el, index, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 12 && rect.height > 12);
    const overlaps = [];
    for (let i = 0; i < boxes.length && overlaps.length < 10; i += 1) {
      for (let j = i + 1; j < boxes.length && overlaps.length < 10; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const x = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
        const y = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
        if (x * y > 120) {
          overlaps.push({
            area: Math.round(x * y),
            a: { tag: a.el.tagName.toLowerCase(), className: String(a.el.className), text: a.el.textContent?.trim().slice(0, 50) ?? "" },
            b: { tag: b.el.tagName.toLowerCase(), className: String(b.el.className), text: b.el.textContent?.trim().slice(0, 50) ?? "" },
          });
        }
      }
    }

    const label = document.querySelector("[data-testid='label-canvas']");
    const labelRect = label?.getBoundingClientRect();

    return {
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      overflowElements,
      textNodes,
      overlaps,
      label: labelRect ? { width: labelRect.width, height: labelRect.height, ratio: labelRect.width / labelRect.height } : null,
    };
  });

  const contrastIssues = pageAudit.textNodes
    .map((node) => ({ ...node, ratio: contrastRatio(node.color, node.background) }))
    .filter((node) => {
      const largeText = node.fontSize >= 24 || (node.fontSize >= 18.66 && Number.parseInt(node.fontWeight, 10) >= 700);
      return node.ratio < (largeText ? 3 : 4.5);
    })
    .slice(0, 12);

  const focusSequence = [];
  for (let index = 0; index < 32; index += 1) {
    await page.keyboard.press("Tab");
    focusSequence.push(await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: "body", text: "", visible: true };
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().slice(0, 80),
        className: String(el.className),
        visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      };
    }));
  }

  return {
    viewport: viewport.name,
    width: viewport.width,
    route,
    h1: pageAudit.h1,
    horizontalOverflow: pageAudit.horizontalOverflow,
    overflowElements: pageAudit.overflowElements,
    contrastIssues,
    overlapIssues: pageAudit.overlaps,
    labelRatio: pageAudit.label?.ratio ?? null,
    focusSequence,
    focusIssues: focusSequence.filter((item) => !item.visible && item.tag !== "nextjs-portal"),
  };
}

async function runRegression(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/crear", { waitUntil: "networkidle" });
  await page.getByLabel("Nombre / Empresa").fill("PurpleShop QA");
  await page.getByLabel("Telefono").first().fill("3001234567");
  await page.getByLabel("Departamento").first().fill("Cundinamarca");
  await page.getByLabel("Ciudad").first().fill("Bogota");
  await page.getByLabel("Direccion").first().fill("Calle 1 # 2-3");
  await page.getByLabel("Nombre y apellidos").fill("Cliente QA");
  await page.getByLabel("Telefono").nth(1).fill("3101234567");
  await page.getByLabel("Departamento").nth(1).fill("Antioquia");
  await page.getByLabel("Ciudad").nth(1).fill("Medellin");
  await page.getByLabel("Direccion completa").fill("Carrera 45 # 10-20");
  await page.getByLabel("Transportadora").fill("Interrapidisimo");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.getByText("Rotulo guardado.").waitFor();
  const orderNumber = await page.locator("[data-testid='label-canvas'] .label-meta strong").first().textContent();

  await page.goto("/historial", { waitUntil: "networkidle" });
  await page.getByLabel("Buscar por numero de pedido, cliente o telefono").fill("Cliente QA");
  await page.getByText("Cliente QA").waitFor();
  const historyContainsOrder = await page.getByText(orderNumber ?? "").first().isVisible();

  await page.goto("/configuracion", { waitUntil: "networkidle" });
  await page.getByLabel("Instagram").fill("@PURPLESHOP.QA");
  await page.getByRole("button", { name: "Guardar configuracion" }).click();
  await page.getByText("Configuracion guardada.").waitFor();

  await page.goto("/crear", { waitUntil: "networkidle" });
  const settingsPersisted = await page.getByText("@PURPLESHOP.QA").first().isVisible();

  return {
    createdOrderNumber: orderNumber,
    historyContainsOrder,
    settingsPersisted,
  };
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  breakpoints: breakpoints.map((item) => item.name),
  routes,
  audits: [],
  regression: null,
};

try {
  const page = await browser.newPage({ baseURL });
  for (const viewport of breakpoints) {
    for (const route of routes) {
      report.audits.push(await auditRoute(page, viewport, route));
    }
  }
  report.regression = await runRegression(page);
  await page.close();
} finally {
  await browser.close();
}

const summary = {
  checkedRoutes: report.audits.length,
  overflowFailures: report.audits.filter((item) => item.horizontalOverflow > 2 || item.overflowElements.length).length,
  contrastFailures: report.audits.filter((item) => item.contrastIssues.length).length,
  overlapFailures: report.audits.filter((item) => item.overlapIssues.length).length,
  focusFailures: report.audits.filter((item) => item.focusIssues.length).length,
  labelRatioFailures: report.audits.filter((item) => item.labelRatio && Math.abs(item.labelRatio - 14 / 11) > 0.03).length,
  regression: report.regression,
};

await writeFile(path.join(outputDir, "qa-final-report.json"), JSON.stringify(report, null, 2));
await writeFile(path.join(outputDir, "qa-final-summary.json"), JSON.stringify(summary, null, 2));

console.log(JSON.stringify(summary, null, 2));

if (
  summary.overflowFailures ||
  summary.contrastFailures ||
  summary.overlapFailures ||
  summary.focusFailures ||
  summary.labelRatioFailures ||
  !summary.regression?.historyContainsOrder ||
  !summary.regression?.settingsPersisted
) {
  process.exitCode = 1;
}
