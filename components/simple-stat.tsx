import { Progress } from "./ui/progress"

export function SimpleStat({
  label,
  value,
  total,
  formatValue,
  color,
  indicatorClassName,
}: {
  label: string
  value: number
  formatValue?: (value: number) => string
  total: number
  color?: string
  indicatorClassName?: string
}) {
  return (
    <div className="flex flex-col rounded-md border p-4 gap-2">
      <div className="text-sm text-muted-foreground leading-none">{label}</div>
      <div
        className="shrink-0 text-base md:text-lg font-semibold leading-4"
        style={{
          color,
        }}
      >
        {formatValue ? formatValue(value) : value.toFixed(1)}
      </div>

      {total !== undefined && total !== null ? (
        <Progress
          value={(value / total) * 100}
          className="bg-foreground/5 h-1.5 mt-1"
          indicatorClassName={indicatorClassName}
        />
      ) : null}
    </div>
  )
}
