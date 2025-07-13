export function ValueLabelPairRow({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-start md:items-center justify-between">
      <div className="text-sm text-muted-foreground md:flex-none w-[200px] text-right md:text-left font-semibold flex items-center justify-end">
        {label}
      </div>
      <div className="text-sm text-muted-foreground md:flex-1 min-w-0">
        {value}
      </div>
    </div>
  )
}
