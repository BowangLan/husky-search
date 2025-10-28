"use client"

import React from "react"
import Link from "next/link"
import { CourseCecItem } from "@/convex/courses"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts"

import { formatTerm, getColor5 } from "@/lib/utils"
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

type RadarDatum = {
  label: string
  value: number
}

const chartConfig = {
  average: {
    label: "Average",
    color: "var(--color-blue-500)",
  },
} satisfies ChartConfig

function wrapLabelIntoLines(
  text: string,
  maxCharsPerLine: number = 16
): string[] {
  const words = String(text ?? "").split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const proposed = currentLine ? `${currentLine} ${word}` : word
    if (proposed.length <= maxCharsPerLine) {
      currentLine = proposed
    } else {
      if (currentLine) lines.push(currentLine)
      // If a single word is longer than maxCharsPerLine, hard-wrap it
      if (word.length > maxCharsPerLine) {
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          const chunk = word.slice(i, i + maxCharsPerLine)
          if (i === 0) {
            currentLine = chunk
          } else {
            lines.push(currentLine)
            currentLine = chunk
          }
        }
      } else {
        currentLine = word
      }
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

// Custom tick renderer for PolarAngleAxis that supports multi-line labels
const renderWrappedPolarTick = (props: any) => {
  const { payload, x, y, textAnchor } = props
  const fillColor = props.fill || props.stroke || "#666"
  const value = String(payload?.value ?? "")
  const lines = wrapLabelIntoLines(value, 16)

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="recharts-polar-angle-axis-tick"
    >
      <text
        x={0}
        y={0}
        textAnchor={textAnchor || "middle"}
        fill={fillColor}
        fontSize={12}
        dominantBaseline="central"
        pointerEvents="none"
      >
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

export function CecProfessorEvalRadarChart({
  data,
  evals,
  onViewAllEvals,
}: {
  data: RadarDatum[]
  evals: CourseCecItem[]
  onViewAllEvals: () => void
}) {
  return (
    <Card hoverInteraction={false}>
      <CardContent className="py-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto max-h-[300px] [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible"
        >
          <RadarChart data={data}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {/* <PolarAngleAxis dataKey="label" tick={renderWrappedPolarTick} /> */}
            <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
            <PolarGrid />
            <PolarRadiusAxis domain={[0, 5]} tickCount={6} axisLine={false} />
            <Radar
              dataKey="value"
              fill="var(--color-average)"
              fillOpacity={0.2}
              stroke="var(--color-average)"
              strokeWidth={2}
              strokeOpacity={0.4}
              dot={(props) => {
                const { cx, cy, value, payload, key } = props
                const v =
                  typeof value === "number"
                    ? value
                    : Number(payload?.value ?? 0)
                const fill = getColor5(Number.isFinite(v) ? v : 0)
                return (
                  <circle
                    key={key}
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
      <CardFooter>
        <div className="flex items-center gap-2 text-muted-foreground text-sm leading-relaxed font-medium justify-center w-full text-center">
          <p>
            Averaged over {evals.length} evaluations (
            {evals.map((ev, index) => (
              <React.Fragment key={index}>
                <span key={index} className="inline-flex">
                  <Link
                    href={`https://www.washington.edu/cec/${ev.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-500 font-medium underline inline-flex"
                  >
                    {formatTerm(ev.term)}
                  </Link>
                </span>
                {index < evals.length - 1 && ", "}
              </React.Fragment>
            ))}
            ).{" "}
          </p>
          {/* <span
            className="text-muted-foreground cursor-pointer hover:text-primary underline trans"
            onClick={onViewAllEvals}
          >
            View all evaluations.
          </span> */}
        </div>
      </CardFooter>
    </Card>
  )
}

export default CecProfessorEvalRadarChart
