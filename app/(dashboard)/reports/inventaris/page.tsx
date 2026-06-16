'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, inventoryItemService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'

const CONDITION_LABEL: Record<string, string> = {
  good: 'Baik', damaged: 'Rusak', lost: 'Hilang',
}

export default function InventarisPage() {
  const schoolId = useSchoolId()
  const [category, setCategory] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: items = [], isLoading } = useQuery({ queryKey: ['inventory-items', 'all-report'], queryFn: () => fetchAllPages(inventoryItemService) })

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() =>
    items
      .filter(i => !category || i.category === category)
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  , [items, category])

  const totalItems = filtered.reduce((s, i) => s + i.quantity, 0)

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { count: number; qty: number }>()
    filtered.forEach(i => {
      const key = i.category
      const prev = map.get(key) ?? { count: 0, qty: 0 }
      map.set(key, { count: prev.count + 1, qty: prev.qty + i.quantity })
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <>
      <Header title="Laporan Inventaris" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Laporan Inventaris Sekolah" subtitle={category || undefined} schoolName={school?.name}>

          {/* Filter */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex items-end gap-2 flex-wrap">
              {groupedByCategory.map(([cat, { count, qty }]) => (
                <span key={cat} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium border border-orange-100">
                  {cat}: {count} jenis · {qty} unit
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada barang ditemukan.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'Nama Barang', 'Kategori', 'Jumlah', 'Kondisi'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left ${h === 'Jumlah' ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, i) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.category}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.condition === 'good' ? 'bg-green-50 text-green-700'
                            : item.condition === 'damaged' ? 'bg-red-50 text-red-600'
                            : item.condition === 'lost' ? 'bg-gray-100 text-gray-500'
                            : 'bg-gray-50 text-gray-600'
                          }`}>
                            {item.condition ? (CONDITION_LABEL[item.condition] ?? item.condition) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">Total Unit</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">{totalItems}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
