'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'

interface Props {
  title: string
  subtitle?: string
  schoolName?: string
  children: React.ReactNode
}

export default function ReportWrapper({ title, subtitle, schoolName, children }: Props) {
  const [printDate, setPrintDate] = useState('')
  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  return (
    <div>
      <style>{`
        @media print {
          aside, header { display: none !important; }
          .ml-64, .ml-16 { margin-left: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          <Printer size={15} />
          Cetak / PDF
        </button>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b border-gray-400">
        {schoolName && <p className="text-base font-bold uppercase tracking-wide">{schoolName}</p>}
        <p className="text-lg font-semibold mt-1">{title}</p>
        {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
        {printDate && <p className="text-xs text-gray-500 mt-2">Dicetak: {printDate}</p>}
      </div>

      {children}
    </div>
  )
}
