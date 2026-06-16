import type { PaginatedData } from '@/types'

export const PER_PAGE = 15

export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PER_PAGE
  return { from, to: from + PER_PAGE - 1 }
}

export function buildPaginated<T>(data: T[] | null, count: number | null, page: number): PaginatedData<T> {
  return {
    data: data ?? [],
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil((count ?? 0) / PER_PAGE)),
      per_page: PER_PAGE,
      total: count ?? 0,
    },
  }
}
