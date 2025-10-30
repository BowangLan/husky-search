import { Footer } from "../footer"
import { AppSidebarLayout } from "@/components/app-sidebar-layout"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden">
      <AppSidebarLayout>
        {children}
        {/* <Footer /> */}
      </AppSidebarLayout>
    </div>
  )
}
