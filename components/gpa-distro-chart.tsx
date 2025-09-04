import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const GPADistroChart = ({
  data,
}: {
  data: { gpa: string; count: number }[]
}) => {
  const chartConfig = {
    count: {
      label: "Students",
      color: "var(--chart-2)",
    },
  }

  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={data.map((d) => ({
          gpa: Number(d.gpa) / 10,
          count: d.count,
        }))}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="gpa"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(v) =>
            typeof v === "number" ? v.toFixed(1) : String(v)
          }
          interval={0}
          ticks={[0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                `GPA ${
                  typeof label === "number" ? label.toFixed(1) : String(label)
                }`
              }
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
