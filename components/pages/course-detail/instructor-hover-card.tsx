"use client"

import { useMemo } from "react"
import { CourseCecItem } from "@/convex/courses"

import { formatTerm } from "@/lib/utils"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { CecProfessorEvalRadarChart } from "@/components/cec-professor-eval-radar-chart"

import { type CECRatingRow } from "../../cec-eval-progress-bar"

interface InstructorHoverCardProps {
  instructor: string
  cecData: CourseCecItem[]
  children: React.ReactNode
}

export const InstructorHoverCard = ({
  instructor,
  cecData,
  children,
}: InstructorHoverCardProps) => {
  const instructorEvals = useMemo(() => {
    return cecData.filter((item) => item.professor === instructor)
  }, [cecData, instructor])

  const aggregatedQuestions = useMemo(() => {
    if (instructorEvals.length === 0) return []

    const firstQuestions: CECRatingRow[] =
      (instructorEvals?.[0]?.data
        ?.table_data_list_of_dicts as CECRatingRow[]) || []

    const questionOrder = firstQuestions.map((q) => q.Question)
    const questionToValues = new Map<string, number[]>()

    questionOrder.forEach((q) => questionToValues.set(q, []))

    for (const ev of instructorEvals) {
      const qs: CECRatingRow[] =
        (ev.data?.table_data_list_of_dicts as CECRatingRow[]) || []
      for (const q of qs) {
        const valueStr = (q.Mean || q.Median || "").toString()
        const value = parseFloat(valueStr)
        if (Number.isFinite(value)) {
          if (!questionToValues.has(q.Question)) {
            questionToValues.set(q.Question, [])
          }
          questionToValues.get(q.Question)!.push(value)
        }
      }
    }

    return questionOrder.map((question) => {
      const values = questionToValues.get(question) || []
      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : NaN
      return { Question: question, Average: avg }
    })
  }, [instructorEvals])

  if (instructorEvals.length === 0) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-auto bg-background p-4 z-[999]"
        side="bottom"
        align="start"
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base">{instructor}</h4>
            <p className="text-sm text-muted-foreground">
              {instructorEvals.length} evaluation
              {instructorEvals.length > 1 ? "s" : ""} (
              {instructorEvals.map((ev) => formatTerm(ev.term)).join(", ")})
            </p>
          </div>

          {aggregatedQuestions.length > 0 && (
            <div className="w-[550px]">
              <CecProfessorEvalRadarChart
                data={aggregatedQuestions.map((q) => ({
                  label: q.Question.replace(":", ""),
                  value: Number.isFinite(q.Average) ? (q.Average as number) : 0,
                }))}
                evals={instructorEvals}
                onViewAllEvals={() => {}}
              />
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
