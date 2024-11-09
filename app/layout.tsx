import Provider from '@/app/provider'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import AuthWrapper from '@/components/wrapper/auth-wrapper'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import './globals.css'

// Separate viewport export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL("https://pdsr.vercel.app"),
  title: {
    default: '🪖 Daily Sadhana Report',
    template: `%s | Daily Sadhana Report`
  },
  description: '🪷 Govardhan Lifter Stage 🪷 [mataji-edition] - A platform for devotees to track their daily spiritual practices and progress',
  openGraph: {
    title: '🪖 Daily Sadhana Report',
    description: '🪷 Govardhan Lifter Stage 🪷 [mataji-edition] - Track your spiritual journey with our comprehensive Sadhana reporting system',
    images: [
      {
        url: '/assets/iskm.webp',
        width: 1200,
        height: 630,
        alt: 'ISKM Daily Sadhana Report'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🪖 Daily Sadhana Report',
    description: '🎉 v0.0.5 - 🦚 Yamuna Devi Stage 🦚 [prabhu-edition] - Your daily spiritual progress tracker',
    images: ['/assets/iskm.webp'],
    creator: '@iskm',
  },
  keywords: [
    'sadhana',
    'spiritual practice',
    'devotional service',
    'iskm',
    'Krishna consciousness',
    'daily report',
    'spiritual progress',
    'japa tracking',
    'book reading',
    'devotee statistics'
  ],
  authors: [
    {
      name: 'iskm ',
      url: 'https://pdsr.vercel.app'
    }
  ],
  icons: {
    icon: '/assets/iskm.webp',
    apple: '/assets/iskm.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthWrapper>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            rel="preload"
            href="https://utfs.io/f/31dba2ff-6c3b-4927-99cd-b928eaa54d5f-5w20ij.png"
            as="image"
          />
          <link
            rel="preload"
            href="https://utfs.io/f/69a12ab1-4d57-4913-90f9-38c6aca6c373-1txg2.png"
            as="image"
          />
        </head>
        <body className={GeistSans.className}>
          <Provider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </Provider>
        </body>
      </html>
    </AuthWrapper>
  )
}