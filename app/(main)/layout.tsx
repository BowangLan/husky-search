import { SiteHeader } from "@/components/site-header"

import { Footer } from "../footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <SiteHeader />
      <div className="">{children}</div>
      <Footer />
    </div>
  )
}
