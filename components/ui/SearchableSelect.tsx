'use client'

import ReactSelect from 'react-select'

export interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  options: SelectOption[]
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  isClearable?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  disabled,
  isLoading,
  isClearable = true,
}: Props) {
  const selected = options.find((o) => String(o.value) === String(value)) ?? null

  return (
    <ReactSelect<SelectOption>
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? String(opt.value) : '')}
      placeholder={placeholder}
      isDisabled={disabled}
      isLoading={isLoading}
      isClearable={isClearable}
      unstyled
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      classNames={{
        control: ({ isFocused, isDisabled }) =>
          `border rounded-lg text-sm bg-white min-h-[38px] outline-none ${
            isDisabled
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
              : isFocused
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-300 hover:border-gray-400'
          }`,
        valueContainer: () => 'px-3 py-1 gap-1',
        placeholder: () => 'text-gray-400 text-sm',
        singleValue: () => 'text-gray-700 text-sm',
        input: () => 'text-sm text-gray-700',
        menu: () => 'border border-gray-200 rounded-lg shadow-lg mt-1 bg-white overflow-hidden',
        menuList: () => 'py-1',
        option: ({ isSelected, isFocused }) =>
          `px-3 py-2 text-sm cursor-pointer ${
            isSelected ? 'bg-blue-600 text-white' : isFocused ? 'bg-blue-50 text-gray-800' : 'text-gray-700'
          }`,
        noOptionsMessage: () => 'text-sm text-gray-500 py-3 text-center px-3',
        loadingMessage: () => 'text-sm text-gray-500 py-3 text-center',
        clearIndicator: () => 'text-gray-400 hover:text-gray-600 cursor-pointer px-1',
        dropdownIndicator: () => 'text-gray-400 px-2',
        indicatorSeparator: () => 'bg-gray-200 my-1',
      }}
    />
  )
}
