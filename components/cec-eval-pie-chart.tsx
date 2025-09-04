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

const pieConfig = {
  excellent: { label: "Excellent", color: "var(--chart-1)" },
  very_good: { label: "Very Good", color: "var(--chart-2)" },
  good: { label: "Good", color: "var(--chart-3)" },
  fair: { label: "Fair", color: "var(--chart-4)" },
  poor: { label: "Poor", color: "var(--chart-5)" },
  very_poor: { label: "Very Poor", color: "var(--chart-1)" },
} as const

type PieSlice = {
  name: string
  value: number
  fill?: string
}

function percentToNumber(value?: string): number {
  if (!value) return 0
  const parsed = parseFloat(value.replace("%", "").trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function buildPieData(row: CECRatingRow): PieSlice[] {
  return [
    {
      name: "Excellent",
      value: percentToNumber(row.Excellent),
      fill: "var(--color-excellent)",
    },
    {
      name: "Very Good",
      value: percentToNumber(row["Very Good"]),
      fill: "var(--color-very_good)",
    },
    {
      name: "Good",
      value: percentToNumber(row.Good),
      fill: "var(--color-good)",
    },
    {
      name: "Fair",
      value: percentToNumber(row.Fair),
      fill: "var(--color-fair)",
    },
    {
      name: "Poor",
      value: percentToNumber(row.Poor),
      fill: "var(--color-poor)",
    },
    {
      name: "Very Poor",
      value: percentToNumber(row["Very Poor"]),
      fill: "var(--color-very_poor)",
    },
  ]
}

export function CECEvalPieChart({ row }: { row: CECRatingRow }) {
  const data = buildPieData(row)

  return (
    <ChartContainer
      config={pieConfig}
      className="mx-auto h-[220px] w-full aspect-auto pb-0"
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="name" hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {row.Median}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-neutral-500 text-sm"
                    >
                      Median
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export default CECEvalPieChart
