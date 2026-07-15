import { expect, test } from "@playwright/test";

test("creates visible label preview with QR and exact ratio", async ({ page }) => {
  await page.goto("/crear");

  const canvas = page.getByTestId("label-canvas");
  await expect(canvas).toBeVisible();
  await expect(page.getByAltText("QR de Instagram PurpleShop")).toBeVisible();

  await page.getByLabel("Nombre y apellidos").pressSequentially("Ana Perez");
  await page.getByLabel("Telefono").nth(1).pressSequentially("3101234567");
  await page.getByLabel("Ciudad").nth(1).pressSequentially("Medellin");
  await page.getByLabel("Direccion completa").pressSequentially("Carrera 45 # 10-20");

  await expect(canvas.getByText("Ana Perez")).toBeVisible();
  await expect(canvas.getByText("Carrera 45 # 10-20")).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round((box!.width / box!.height) * 100)).toBe(127);
});

test("history search field is available", async ({ page }) => {
  await page.goto("/historial");

  await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
  await expect(page.getByLabel("Buscar por numero de pedido, cliente o telefono")).toBeVisible();
});

test("settings shows estimated next order number", async ({ page }) => {
  await page.goto("/configuracion");

  await expect(page.getByText("PS-2026-000001")).toBeVisible();
});

