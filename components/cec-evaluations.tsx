"use client"

import { useMemo } from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"

import { getColor5 } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BigStat } from "@/components/big-stat"

import { type CECRatingRow } from "./cec-eval-progress-bar"

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

  const groupedByProfessor = sorted.reduce((acc, item) => {
    const professor = item.professor || "Unknown"
    acc[professor] = acc[professor] || []
    acc[professor]!.push(item)
    return acc
  }, {} as Record<string, typeof sorted>)

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
            {Object.entries(groupedByProfessor).map(([professor, evals]) => {
              return (
                <div key={professor} className="grid gap-4 md:gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-base md:text-lg font-semibold">
                        {professor}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {evals.length} evaluation{evals.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {evals.map((ev) => {
                      const surveyed = ev.data?.caption?.surveyed
                      const enrolled = ev.data?.caption?.enrolled
                      const questions: CECRatingRow[] =
                        (ev.data?.table_data_list_of_dicts as CECRatingRow[]) ||
                        []
                      const medians = questions
                        .map((q) => parseFloat((q.Median || "").toString()))
                        .filter((n) => Number.isFinite(n)) as number[]
                      const avgMedian =
                        medians.length > 0
                          ? (
                              medians.reduce((a, b) => a + b, 0) /
                              medians.length
                            ).toFixed(1)
                          : "—"
                      return (
                        <Card key={ev._id} hoverInteraction={false}>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">
                                {formatTerm(ev.term)}
                              </span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {ev.role ? `${ev.role}` : ""}
                                {ev.sessionCode ? ` · ${ev.sessionCode}` : ""}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid-cols-3 gap-3 hidden">
                              <BigStat
                                compact
                                label="Median"
                                value={avgMedian}
                                color="violet"
                              />
                              <BigStat
                                compact
                                label="Surveyed"
                                value={surveyed || "?"}
                                total={enrolled || "?"}
                                color="sky"
                              />
                              <BigStat
                                compact
                                label="Questions"
                                value={questions.length}
                                color="emerald"
                              />
                            </div>
                            {questions.length > 0 ? (
                              <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                                {questions.map((q) => {
                                  const mean = (q.Median || "")
                                    .toString()
                                    .trim()
                                  return (
                                    <div
                                      key={q.Question}
                                      className="flex flex-col rounded-md border p-4 gap-1"
                                    >
                                      <div className="text-sm text-muted-foreground">
                                        {q.Question.replace(":", "")}
                                      </div>
                                      <div
                                        className="shrink-0 text-base md:text-lg font-semibold leading-4"
                                        style={{
                                          color: getColor5(parseFloat(mean)),
                                        }}
                                      >
                                        {mean}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CECEvaluations
