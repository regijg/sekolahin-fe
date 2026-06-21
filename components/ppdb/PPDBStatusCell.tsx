'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ppdbService } from '@/lib/services'
import { ChevronDown } from 'lucide-react'

const OPTIONS = [
  { value: 'draft',     label: 'Draft' },
  { value: 'submitted', label: 'Diajukan' },
  { value: 'accepted',  label: 'Diterima' },
  { value: 'rejected',  label: 'Ditolak' },
]

const COLOR: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
}

interface Props {
  id: number
  value: string
}

export default function PPDBStatusCell({ id, value }: Props) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (status: string) => ppdbService.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppdb-applications'] }),
  })

  const color = COLOR[value] ?? COLOR.draft

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => mutation.mutate(e.target.value)}
        disabled={mutation.isPending}
        className={`appearance-none pl-2 pr-5 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0 outline-none transition-opacity ${color} ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={10}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
      />
    </div>
  )
}
