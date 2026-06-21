'use client'

import { useState, useEffect } from 'react'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

function parse(value: string) {
  if (!value) return { day: 0, month: 0, year: 0 }
  const [y, m, d] = value.split('-').map(Number)
  return { day: d || 0, month: m || 0, year: y || 0 }
}

function toDateString(day: number, month: number, year: number) {
  if (!day || !month || !year) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface Props {
  value: string
  onChange: (value: string) => void
}

const selectClass =
  'border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full'

export default function BirthdatePicker({ value, onChange }: Props) {
  const currentYear = new Date().getFullYear()

  const [day, setDay] = useState(() => parse(value).day)
  const [month, setMonth] = useState(() => parse(value).month)
  const [year, setYear] = useState(() => parse(value).year)

  // Sync when external value changes (e.g. form reset)
  useEffect(() => {
    const p = parse(value)
    setDay(p.day)
    setMonth(p.month)
    setYear(p.year)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const emit = (d: number, m: number, y: number) => {
    onChange(toDateString(d, m, y))
  }

  const maxDay = month && year ? daysInMonth(month, year) : 31

  const handleDay = (d: number) => {
    setDay(d)
    emit(d, month, year)
  }

  const handleMonth = (m: number) => {
    const newMax = m && year ? daysInMonth(m, year) : 31
    const safeDay = day > newMax ? newMax : day
    setMonth(m)
    if (safeDay !== day) setDay(safeDay)
    emit(safeDay, m, year)
  }

  const handleYear = (y: number) => {
    const newMax = month && y ? daysInMonth(month, y) : 31
    const safeDay = day > newMax ? newMax : day
    setYear(y)
    if (safeDay !== day) setDay(safeDay)
    emit(safeDay, month, y)
  }

  return (
    <div className="flex gap-2">
      <div className="w-[72px]">
        <select value={day || ''} onChange={(e) => handleDay(Number(e.target.value))} className={selectClass}>
          <option value="">Hari</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <select value={month || ''} onChange={(e) => handleMonth(Number(e.target.value))} className={selectClass}>
          <option value="">Bulan</option>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>

      <div className="w-[90px]">
        <select value={year || ''} onChange={(e) => handleYear(Number(e.target.value))} className={selectClass}>
          <option value="">Tahun</option>
          {Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
