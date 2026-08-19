import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { AppProvider } from '@/contexts/app-context'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
  title: 'Guardian Financial Tool',
  description: 'Guardian Financial Tool for loan reconciliation, arrears verification, and account scrutiny',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/Screenshot%202026-08-04%20at%2010.38.00.png',
        type: 'image/png',
      },
    ],
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-200 ease-in-out">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
          <Toaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
