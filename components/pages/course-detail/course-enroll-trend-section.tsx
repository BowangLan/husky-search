import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type TermEnrollData = {
  t: number
  c: number
  m: number
}[]

const cleanEnrollData = (enrollData: TermEnrollData): TermEnrollData => {
  if (!Array.isArray(enrollData) || enrollData.length === 0) return []
  if (enrollData.length === 1)
    return [{ t: enrollData[0].t, c: enrollData[0].c, m: enrollData[0].m }]

  const sorted = [...enrollData].sort((a, b) => a.t - b.t)

  const diffs: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i].t - sorted[i - 1].t
    if (delta > 0) diffs.push(delta)
  }

  if (diffs.length === 0) {
    const last = sorted[sorted.length - 1]
    return [{ t: last.t, c: last.c, m: last.m }]
  }

  const minInterval = Math.min(...diffs)
  const startTime = sorted[0].t
  const endTime = sorted[sorted.length - 1].t

  const result: { t: number; c: number; m: number }[] = []
  let idx = 0
  let lastC = sorted[0].c
  let lastM = sorted[0].m

  for (let t = startTime; t < endTime; t += minInterval) {
    while (idx < sorted.length && sorted[idx].t <= t) {
      lastC = sorted[idx].c
      lastM = sorted[idx].m
      idx++
    }
    result.push({ t, c: lastC, m: lastM })
  }

  // Ensure final point at the end time using the latest values
  const lastPoint = sorted[sorted.length - 1]
  result.push({ t: endTime, c: lastPoint.c, m: lastPoint.m })

  return result
}

// @deprecated
export const CourseEnrollTrendSection = ({
  courseCode,
}: {
  courseCode: string
}) => {
  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })

  if (!data) return null

  const termData = data.myplanCourse?.currentTermData?.[0]

  if (!termData) return null

  const cleaned = cleanEnrollData((termData.enrollData as any) || [])

  if (!cleaned || cleaned.length === 0) return null

  const chartData = cleaned.map((d) => ({
    t: d.t,
    timeLabel: new Date(d.t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    available: d.c,
    capacity: d.m,
  }))

  const first = cleaned[0]
  const last = cleaned[cleaned.length - 1]
  const delta = last.c - first.c

  const chartConfig = {
    available: {
      label: "Available",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const values = cleaned.map((d) => d.c)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const yDomain: [number, number] =
    minVal === maxVal ? [minVal - 1, maxVal + 1] : [minVal, maxVal]

  return (
    <Card hoverInteraction={false}>
      <CardHeader>
        <CardTitle>Enrollment trend</CardTitle>
        <CardDescription>Live availability over recent checks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="available"
              type="natural"
              stroke="var(--color-available)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {delta >= 0 ? "Trending up" : "Trending down"} by{" "}
              {Math.abs(delta)}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {new Date(first.t).toLocaleString()} –{" "}
              {new Date(last.t).toLocaleString()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
