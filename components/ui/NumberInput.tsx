'use client'

import { forwardRef, useState, useEffect } from 'react'

function toDisplay(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return ''
  const digits = String(val).replace(/[^0-9]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: number | string | null
  onChange?: (value: number | '') => void
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [display, setDisplay] = useState(() => toDisplay(value))

    useEffect(() => {
      setDisplay(toDisplay(value))
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/[^0-9]/g, '')
      setDisplay(digits ? Number(digits).toLocaleString('id-ID') : '')
      onChange?.(digits ? Number(digits) : '')
    }

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
      />
    )
  }
)

NumberInput.displayName = 'NumberInput'
export default NumberInput
