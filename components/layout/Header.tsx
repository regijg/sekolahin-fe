'use client'

import { useEffect, useState } from 'react'
import { Bell, User, Menu } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

export default function Header({ title }: { title?: string }) {
  const [userName, setUserName] = useState('Admin')
  const { toggleMobile, toggleCollapsed, isMobile } = useSidebar()

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUserName(u.name || 'Admin')
      } catch {}
    }
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Hamburger: opens drawer on mobile, toggles collapse on desktop */}
        <button
          onClick={isMobile ? toggleMobile : toggleCollapsed}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-700 transition-colors relative">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white rounded-full p-1.5">
            <User size={16} />
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
        </div>
      </div>
    </header>
  )
}
