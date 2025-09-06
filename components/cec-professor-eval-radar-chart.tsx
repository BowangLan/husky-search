"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts"

import { getColor5 } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type RadarDatum = {
  label: string
  value: number
}

const chartConfig = {
  average: {
    label: "Average",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function CecProfessorEvalRadarChart({
  data,
  title = "CEC Evaluation Averages",
  description,
}: {
  data: RadarDatum[]
  title?: string
  description?: string
}) {
  return (
    <Card hoverInteraction={false}>
      <CardContent className="py-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[360px] [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible"
        >
          <RadarChart data={data}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="label" />
            <PolarGrid />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} axisLine={false} />
            <Radar
              dataKey="value"
              fill="var(--color-average)"
              fillOpacity={0.6}
              dot={(props: any) => {
                const { cx, cy, value, payload } = props
                const v =
                  typeof value === "number"
                    ? value
                    : Number(payload?.value ?? 0)
                const fill = getColor5(Number.isFinite(v) ? v : 0)
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={fill}
                    stroke="transparent"
                  />
                )
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default CecProfessorEvalRadarChart
