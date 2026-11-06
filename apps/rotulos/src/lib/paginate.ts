/**
 * PostgREST/Supabase corta cada consulta en `max_rows` (1000 por defecto) SIN
 * lanzar error. Este helper recorre todas las paginas para que ningun listado
 * quede truncado en silencio cuando el negocio crezca.
 *
 * `fetchPage` debe usar un orden estable (agregar `id` como desempate) para que
 * las paginas no se solapen ni se salten filas.
 */
export const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: unknown };

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = PAGE_SIZE,
): Promise<{ data: T[]; error: unknown }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) return { data: all, error };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) return { data: all, error: null };
  }
}
