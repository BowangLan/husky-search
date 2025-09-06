"use client"

import { Cell, LabelList, RadialBar, RadialBarChart } from "recharts"

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
import { getColor5 } from "@/lib/utils"

type RadialDatum = {
  label: string
  value: number
  fill?: string
}

const chartConfig = {
  value: {
    label: "Average",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function CecProfessorEvalRadialChart({
  data,
  title = "CEC Evaluation Averages",
  description,
}: {
  data: RadialDatum[]
  title?: string
  description?: string
}) {
  return (
    <Card hoverInteraction={false}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="label" />}
            />
            <RadialBar
              dataKey="value"
              background
              fill="var(--color-value)"
              max={5}
            >
              {data.map((d, i) => (
                <Cell key={`cell-${i}`} fill={getColor5(Number.isFinite(d.value) ? d.value : 0)} />
              ))}
              <LabelList
                position="insideStart"
                dataKey="label"
                className="fill-white mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default CecProfessorEvalRadialChart
