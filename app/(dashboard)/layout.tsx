'use client'

import Sidebar from '@/components/layout/Sidebar'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar()

  const marginLeft = isMobile ? 'ml-0' : collapsed ? 'ml-16' : 'ml-64'

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className={`flex-1 ${marginLeft} flex flex-col min-h-screen overflow-auto transition-all duration-200`}>
        {children}
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
