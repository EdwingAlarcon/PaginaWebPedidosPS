import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "@/lib/paginate";

const rows = (n: number, start = 0) => Array.from({ length: n }, (_, i) => start + i);

describe("fetchAllPages", () => {
  it("junta todas las paginas hasta recibir una incompleta", async () => {
    const fetchPage = vi.fn(async (from: number) => ({
      data: from === 0 ? rows(3) : from === 3 ? rows(3, 3) : rows(1, 6),
      error: null,
    }));
    const result = await fetchAllPages(fetchPage, 3);
    expect(result.data).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(fetchPage.mock.calls).toEqual([[0, 2], [3, 5], [6, 8]]);
  });

  it("hace una sola consulta si cabe en una pagina", async () => {
    const fetchPage = vi.fn(async () => ({ data: rows(2), error: null }));
    expect((await fetchAllPages(fetchPage, 3)).data).toEqual([0, 1]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("pide una pagina extra vacia cuando el total es multiplo exacto", async () => {
    const fetchPage = vi.fn(async (from: number) => ({ data: from === 0 ? rows(3) : [], error: null }));
    expect((await fetchAllPages(fetchPage, 3)).data).toEqual([0, 1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("devuelve el error si una pagina falla", async () => {
    const boom = new Error("boom");
    const fetchPage = vi.fn(async () => ({ data: null, error: boom }));
    expect((await fetchAllPages(fetchPage, 3)).error).toBe(boom);
  });
});
