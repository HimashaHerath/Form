import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { StoreProvider } from '@/components/layout/StoreProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flux',
  description: 'Track your metabolic rate from real data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen`}>
        <StoreProvider>
          <div className="flex min-h-screen">
            <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-800 bg-zinc-950">
              <Navbar />
            </aside>
            <main className="flex-1 md:ml-56 pb-20 md:pb-0">
              {children}
            </main>
          </div>
          <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-zinc-800 bg-zinc-950 z-50">
            <Navbar mobile />
          </div>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  )
}
