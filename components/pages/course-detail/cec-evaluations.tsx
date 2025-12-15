"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CourseCecItem } from "@/convex/courses"
import { useQuery } from "convex/react"
import { ExternalLinkIcon, Grid, List, Radar, X } from "lucide-react"

import { ConvexCourseDetail } from "@/types/convex-courses"
import { COMPONENTS, useHasComponentAccess } from "@/config/permissions"
import { cn, formatTerm, getColor5, getColor5Classes } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterTabItem, FilterTabList } from "@/components/ui/filter-tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BigStat } from "@/components/big-stat"
import { CecProfessorEvalRadarChart } from "@/components/cec-professor-eval-radar-chart"
import { CecProfessorEvalRadialChart } from "@/components/cec-professor-eval-radial-chart"
import { SimpleStat } from "@/components/simple-stat"
import { StudentRequiredCardContent } from "@/components/student-required-card"

import { type CECRatingRow } from "../../cec-eval-progress-bar"

const ProfessorEvalBlock = ({
  professor,
  evals,
  showIndividualEvals,
  isCurrentInstructor,
}: {
  professor: string
  evals: CourseCecItem[]
  showIndividualEvals?: boolean
  isCurrentInstructor?: boolean
}) => {
  // const [showIndividualEvals, setShowIndividualEvals] = useState(false)
  const [viewType, setViewType] = useState<"radar" | "grid">("radar")

  const aggregatedQuestions = useMemo(() => {
    const firstQuestions: CECRatingRow[] =
      (evals?.[0]?.data?.table_data_list_of_dicts as CECRatingRow[]) || []

    const questionOrder = firstQuestions.map((q) => q.Question)
    const questionToValues = new Map<string, number[]>()

    questionOrder.forEach((q) => questionToValues.set(q, []))

    for (const ev of evals) {
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
  }, [evals])

  return (
    <Card hoverInteraction={false}>
      <CardHeader>
        <div className="flex items-center justify-between flex-none">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-semibold">
                {professor}
              </span>
              {isCurrentInstructor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Currently teaching</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* <span className="text-xs md:text-sm text-muted-foreground">
                {evals.length} evaluation{evals.length > 1 ? "s" : ""}
              </span> */}

            {/* Roles */}
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(evals.map((ev) => ev.role))).map((role) => (
                <span
                  key={role}
                  className="text-xs md:text-sm text-muted-foreground"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          {/* <div className="items-center gap-2 hidden">
            <Label
              htmlFor={`toggle-evals-${professor}`}
              className="text-xs md:text-sm text-muted-foreground"
            >
              Show individual evals
            </Label>
            <Switch
              id={`toggle-evals-${professor}`}
              checked={showIndividualEvals}
              onCheckedChange={setShowIndividualEvals}
            />
          </div> */}
          <FilterTabList>
            <FilterTabItem
              square={true}
              active={viewType === "radar"}
              onClick={() => setViewType("radar")}
            >
              <Radar className="size-4" />
            </FilterTabItem>
            <FilterTabItem
              square={true}
              active={viewType === "grid"}
              onClick={() => setViewType("grid")}
            >
              <Grid className="size-4" />
            </FilterTabItem>
          </FilterTabList>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4">
            {aggregatedQuestions.length > 0 ? (
              <>
                {viewType === "radar" && (
                  <CecProfessorEvalRadarChart
                    data={aggregatedQuestions.map((q) => ({
                      label: q.Question.replace(":", ""),
                      value: Number.isFinite(q.Average)
                        ? (q.Average as number)
                        : 0,
                    }))}
                    evals={evals}
                    onViewAllEvals={() => {}}
                  />
                )}
                {viewType === "grid" && (
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                    }}
                  >
                    {aggregatedQuestions.map((q) => (
                      <SimpleStat
                        key={q.Question}
                        label={q.Question.replace(":", "")}
                        value={q.Average}
                        total={5}
                        color={getColor5(q.Average)}
                        indicatorClassName={`${getColor5Classes(q.Average)}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {showIndividualEvals &&
              evals.map((ev) => {
                const surveyed = ev.data?.caption?.surveyed
                const enrolled = ev.data?.caption?.enrolled
                const questions: CECRatingRow[] =
                  (ev.data?.table_data_list_of_dicts as CECRatingRow[]) || []
                const medians = questions
                  .map((q) => parseFloat((q.Median || "").toString()))
                  .filter((n) => Number.isFinite(n)) as number[]
                const avgMedian =
                  medians.length > 0
                    ? (
                        medians.reduce((a, b) => a + b, 0) / medians.length
                      ).toFixed(1)
                    : "—"
                return (
                  <Card key={ev._id} hoverInteraction={false}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {formatTerm(ev.term)} • {ev.professor}
                            </span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Link
                                  href={`https://www.washington.edu/cec/${ev.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-purple-500"
                                >
                                  <ExternalLinkIcon className="w-4 h-4" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>View on CEC</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-muted-foreground font-normal">
                            {ev.role ? `${ev.role}` : ""}
                            {ev.sessionCode ? ` · ${ev.sessionCode}` : ""}
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {questions.length > 0 ? (
                        <div className="grid gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
                          {questions.map((q) => {
                            const mean = (q.Median || "").toString().trim()
                            return (
                              <SimpleStat
                                key={q.Question}
                                label={q.Question.replace(":", "")}
                                value={parseFloat(mean)}
                                total={5}
                                color={getColor5(parseFloat(mean))}
                                indicatorClassName={`${getColor5Classes(
                                  parseFloat(mean)
                                )}`}
                              />
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
      </CardContent>
    </Card>
  )
}

export function CECEvaluations({
  courseDetail: data,
}: {
  courseDetail: ConvexCourseDetail
}) {
  const hasCECPermission = useHasComponentAccess(COMPONENTS.CEC_EVALUATIONS)
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(
    null
  )

  const items = data?.cecCourse
  const currentInstructors = useMemo(() => {
    const termData = data.myplanCourse.currentTermData?.[0]
    const sessions = Array.isArray(termData?.sessions) ? termData!.sessions : []
    return new Set(
      sessions.map((session: any) => session.instructor).filter(Boolean)
    )
  }, [data.myplanCourse])

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

  if (!hasCECPermission) {
    // not a student
    return (
      <Card hoverInteraction={false}>
        <StudentRequiredCardContent featureName="CEC Evaluations" />
      </Card>
    )
  }

  if (data === undefined) {
    // loading
    return null
  }

  const groupedByProfessor = sorted.reduce((acc, item) => {
    const professor = item.professor || "Unknown"
    acc[professor] = acc[professor] || []
    acc[professor]!.push(item)
    return acc
  }, {} as Record<string, typeof sorted>)

  const toggleProfessor = (professor: string) => {
    setSelectedProfessor(selectedProfessor === professor ? null : professor)
  }

  return (
    <>
      <Card hoverInteraction={false}>
        <CardContent>
          <div>
            {/* chips of professors */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupedByProfessor).map(([professor, evals]) => {
                const isCurrentInstructor = currentInstructors.has(professor)
                return (
                  <div
                    key={professor}
                    className={cn(
                      "flex items-center gap-2 px-2.5 h-9 rounded-lg border cursor-pointer trans",
                      selectedProfessor === professor
                        ? "text-white bg-primary border-primary"
                        : isCurrentInstructor
                        ? "bg-button-ghost-hover-active border-green-500/30"
                        : "bg-button-ghost-hover-active border-border"
                    )}
                    role="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleProfessor(professor)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{professor}</span>
                      {isCurrentInstructor && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Currently teaching</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-center size-5 bg-foreground/5 text-xs font-medium rounded-full text-muted-foreground",
                        selectedProfessor === professor &&
                          "text-white bg-foreground/10"
                      )}
                    >
                      {evals.length}
                    </div>
                  </div>
                )
              })}

              {/* Clear */}
              {selectedProfessor && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-2.5 h-9 hover:bg-foreground/10 active:bg-foreground/15 rounded-lg border border-transparent cursor-pointer trans"
                  )}
                  role="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedProfessor(null)
                  }}
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground/90">
                    Clear
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card hoverInteraction={false} className="min-h-screen">
        <CardContent>
        </CardContent>
      </Card> */}

      {selectedProfessor && (
        <div>
          <ProfessorEvalBlock
            professor={selectedProfessor}
            evals={groupedByProfessor[selectedProfessor]}
            showIndividualEvals={true}
            isCurrentInstructor={currentInstructors.has(selectedProfessor)}
          />
        </div>
      )}

      {!sorted || sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No CEC evaluations found.
        </p>
      ) : (
        <div
          className="grid gap-4 md:gap-6 gap-y-8 sm:grid-cols-2"
          style={{
            display: !selectedProfessor ? "grid" : "none",
          }}
        >
          {Object.entries(groupedByProfessor).map(([professor, evals]) => {
            return (
              <ProfessorEvalBlock
                key={professor}
                professor={professor}
                evals={evals}
                isCurrentInstructor={currentInstructors.has(professor)}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

export default CECEvaluations
