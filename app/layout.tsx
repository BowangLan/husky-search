import "@/styles/globals.css"
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { GlobalLayoutWrapper } from "@/components/global-layout-wrapper"
import { MessageDialogManager } from "@/components/message-dialog-manager"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

import "@xyflow/react/dist/style.css"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    // icon: "/favicon.ico",
    icon: "/favicon-180x180.png",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "h-screen bg-background font-sans antialiased overflow-y-auto",
            fontSans.variable
          )}
        >
          <GlobalLayoutWrapper>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
              <MessageDialogManager />
              {process.env.NODE_ENV === "development" && <TailwindIndicator />}
              <Toaster
                position="top-center"
                richColors
                closeButton
                duration={3000}
              />
            </ThemeProvider>
          </GlobalLayoutWrapper>
          <Analytics />
        </body>
      </html>
    </>
  )
}
