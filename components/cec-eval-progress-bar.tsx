"use client"

import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export type CECRatingRow = {
  Question: string
  Excellent?: string
  "Very Good"?: string
  Good?: string
  Fair?: string
  Poor?: string
  "Very Poor"?: string
  Median?: string
}

type ProgressBarSlice = {
  name: string
  value: number
  left: number
  width?: string
  fill?: string
  right?: number
}

function percentToNumber(value?: string): number {
  if (!value) return 0
  const parsed = parseFloat(value.replace("%", "").trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function buildPieData(row: CECRatingRow): ProgressBarSlice[] {
  const excellent = percentToNumber(row.Excellent)
  const veryGood = percentToNumber(row["Very Good"])
  const good = percentToNumber(row.Good)
  const fair = percentToNumber(row.Fair)
  const poor = percentToNumber(row.Poor)
  const veryPoor = percentToNumber(row["Very Poor"])

  return [
    {
      name: "Excellent",
      value: percentToNumber(row.Excellent),
      left: veryPoor + veryGood + good + fair + poor,
      // width: row.Excellent ? `${row.Excellent}` : "0%",
      right: 0,
      fill: "var(--color-green-500)",
    },
    {
      name: "Very Good",
      value: percentToNumber(row["Very Good"]),
      left: veryPoor + good + fair + poor,
      width: row["Very Good"] ? `${row["Very Good"]}` : "0%",
      fill: "var(--color-blue-500)",
    },
    {
      name: "Good",
      value: percentToNumber(row.Good),
      left: veryPoor + poor + fair,
      width: row.Good ? `${row.Good}` : "0%",
      fill: "var(--color-yellow-500)",
    },
    {
      name: "Fair",
      value: percentToNumber(row.Fair),
      left: veryPoor + poor,
      width: row.Fair ? `${row.Fair}` : "0%",
      fill: "var(--color-orange-500)",
    },
    {
      name: "Poor",
      value: percentToNumber(row.Poor),
      left: veryPoor,
      width: row.Poor ? `${row.Poor}` : "0%",
      fill: "var(--color-red-500)",
    },
    {
      name: "Very Poor",
      value: percentToNumber(row["Very Poor"]),
      left: 0,
      width: row["Very Poor"] ? `${row["Very Poor"]}` : "0%",
      fill: "var(--color-stone-500)",
    },
  ]
}

const DotLabel = ({
  label,
  color,
  value,
}: {
  label: string
  color: string
  value: string
}) => {
  return (
    <div className="flex flex-row items-center gap-1.5">
      <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xs text-foreground">{value}</div>
    </div>
  )
}

export function CECEvalProgressBar({ row }: { row: CECRatingRow }) {
  const data = buildPieData(row)

  return (
    <div>
      <div className="flex gap-2 items-center">
        <div className="text-sm text-muted-foreground mb-2">{row.Question}</div>
        <div className="text-sm text-foreground mb-2">{row.Median}</div>
      </div>
      <div className="overflow-hidden rounded-full bg-secondary h-2 bg-stone-200/20 relative">
        {data.map((item) => (
          <div
            key={item.name}
            className="h-full w-full absolute"
            style={{
              backgroundColor: item.fill,
              left: `${item.left}%`,
              width: item.width,
              right: item.right,
            }}
          />
        ))}
      </div>
      <div className="flex flex-row items-center flex-wrap gap-2 mt-3">
        <DotLabel
          label="Excellent"
          color="var(--color-green-500)"
          value={row.Excellent || "0%"}
        />
        <DotLabel
          label="Very Good"
          color="var(--color-blue-500)"
          value={row["Very Good"] || "0%"}
        />
        <DotLabel
          label="Good"
          color="var(--color-yellow-500)"
          value={row.Good || "0%"}
        />
        <DotLabel
          label="Fair"
          color="var(--color-orange-500)"
          value={row.Fair || "0%"}
        />
        <DotLabel
          label="Poor"
          color="var(--color-red-500)"
          value={row.Poor || "0%"}
        />
        <DotLabel
          label="Very Poor"
          color="var(--color-stone-500)"
          value={row["Very Poor"] || "0%"}
        />
      </div>
    </div>
  )
}

export default CECEvalProgressBar
