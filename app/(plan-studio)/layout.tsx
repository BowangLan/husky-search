export default function PlanStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-screen flex flex-col w-screen">{children}</div>
}
