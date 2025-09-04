"use client"

import { useMemo } from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CECEvalPieChart, CECRatingRow } from "@/components/cec-eval-pie-chart"
import { Section, SectionContent, SectionHeader } from "@/components/section"

import CECEvalProgressBar from "./cec-eval-progress-bar"

export type CECCourseEvaluation = {
  _id: string
  courseCode: string
  professor?: string
  role?: string
  term?: string
  sessionCode?: string
  letter?: string
  data?: {
    caption?: { enrolled?: string; surveyed?: string; text?: string }
    h1?: string
    h2?: string
    headers?: string[]
    table_data_list_of_dicts?: Array<{
      Question: string
      Excellent?: string
      "Very Good"?: string
      Good?: string
      Fair?: string
      Poor?: string
      "Very Poor"?: string
      Median?: string
    }>
  }
}

function formatTerm(term?: string) {
  if (!term) return ""
  // Expected like "20252" -> year 2025, quarter code 2 → SP25 mapping by provided examples AU24, WI25, SP25
  const year = term.slice(0, 4)
  const q = term.slice(4)
  const quarterMap: Record<string, string> = {
    "1": "WI",
    "2": "SP",
    "3": "SU",
    "4": "AU",
  }
  const shortYear = year.slice(2)
  return `${quarterMap[q] || ""}${shortYear}`
}

export function CECEvaluations({ courseCode }: { courseCode: string }) {
  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })

  const items = data?.cecCourse
  const sorted = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => {
      // sort by term desc then creation if available
      const at = Number(a.term || 0)
      const bt = Number(b.term || 0)
      if (bt !== at) return bt - at
      return 0
    })
  }, [items])

  if (data === undefined) return null

  return (
    <Card hoverInteraction={false}>
      <CardHeader>
        <h3 className="text-sm text-muted-foreground font-medium">
          CEC Evaluations
        </h3>
      </CardHeader>
      <CardContent>
        {!sorted || sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No CEC evaluations found.
          </p>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {sorted.map((ev) => {
              const surveyed = ev.data?.caption?.surveyed
              const enrolled = ev.data?.caption?.enrolled
              const questions: CECRatingRow[] =
                (ev.data?.table_data_list_of_dicts as CECRatingRow[]) || []
              return (
                <Card key={ev._id} hoverInteraction={false}>
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-1">
                      <span className="text-base md:text-lg font-semibold">
                        {formatTerm(ev.term)} ·{" "}
                        {ev.professor ||
                          ev.data?.h2?.split("&nbsp;&nbsp;")?.[0] ||
                          "Instructor"}
                      </span>
                      <span className="text-muted-foreground text-xs md:text-sm font-normal">
                        {ev.role ? `${ev.role}` : ""}
                        {ev.sessionCode ? ` · ${ev.sessionCode}` : ""}
                        {surveyed || enrolled
                          ? ` · ${surveyed || "?"} Surveyed / ${
                              enrolled || "?"
                            } Enrolled`
                          : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {questions.map((q) => (
                        <div key={q.Question}>
                          <CECEvalProgressBar key={q.Question} row={q} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CECEvaluations
