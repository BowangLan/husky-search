import {
  Label,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { easinessScore } from "@/lib/gpa-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"

export const EasinessPieChart = ({
  data,
}: {
  data: { gpa: string; count: number }[]
}) => {
  const chartConfig = {
    score: {
      label: "Easiness",
      color: "var(--chart-3)",
    },
  }

  const easiness = easinessScore(data) // 0–100
  const chartData = [
    {
      score: easiness,
      fill: "var(--color-score)",
    },
  ]

  return (
    <Card className="flex flex-col" hoverInteraction={false}>
      <CardHeader className="items-center pb-0">
        <CardTitle>Course Easiness</CardTitle>
        <CardDescription>Based on GPA distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-270}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="score"
              background
              cornerRadius={10}
              fill="var(--color-score)"
            />
            <PolarRadiusAxis
              tick={false}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
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
                          className="fill-foreground text-4xl font-bold"
                        >
                          {easiness.toFixed(0)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Easiness
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
