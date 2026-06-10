import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap', preload: false })

export const metadata: Metadata = {
  title: 'SEKOLAHIN Admin',
  description: 'Sistem Informasi Manajemen Sekolah',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={geist.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
