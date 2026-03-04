import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { DM_Serif_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { StoreProvider } from '@/components/layout/StoreProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'FORM',
  description: 'Know your body. Feed it right.',
  applicationName: 'FORM',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FORM',
  },
  icons: {
    apple: '/icons/icon-180x180.png',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${dmSerif.variable} ${jetbrainsMono.variable} font-sans bg-[#0A0A0F] text-[#F0F0F8] min-h-screen antialiased`}>
        <StoreProvider>
          <TooltipProvider>
            <AppShell>
              {children}
            </AppShell>
            <Toaster />
          </TooltipProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
