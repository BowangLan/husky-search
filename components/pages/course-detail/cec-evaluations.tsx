"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CourseCecItem } from "@/convex/courses"
import { useQuery } from "convex/react"
import { ExternalLinkIcon, Grid, List, Radar, X } from "lucide-react"

import { cn, formatTerm, getColor5, getColor5Classes } from "@/lib/utils"
import { useIsStudent } from "@/hooks/use-is-student"
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
}: {
  professor: string
  evals: CourseCecItem[]
}) => {
  const [showIndividualEvals, setShowIndividualEvals] = useState(false)
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
    <div key={professor} className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-none">
        <div className="flex flex-col">
          <span className="text-base md:text-lg font-semibold">
            {professor}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">
            {evals.length} evaluation{evals.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* <Label
            htmlFor={`toggle-evals-${professor}`}
            className="text-xs md:text-sm text-muted-foreground"
          >
            Show individual evals
          </Label>
          <Switch
            id={`toggle-evals-${professor}`}
            checked={showIndividualEvals}
            onCheckedChange={setShowIndividualEvals}
          /> */}
        </div>
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
      <div className="grid gap-4">
        {aggregatedQuestions.length > 0 ? (
          <>
            {viewType === "radar" && (
              <CecProfessorEvalRadarChart
                data={aggregatedQuestions.map((q) => ({
                  label: q.Question.replace(":", ""),
                  value: Number.isFinite(q.Average) ? (q.Average as number) : 0,
                }))}
                evals={evals}
                onViewAllEvals={() => setShowIndividualEvals(true)}
              />
            )}
            {viewType === "grid" && (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
                ? (medians.reduce((a, b) => a + b, 0) / medians.length).toFixed(
                    1
                  )
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
                    <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
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
  )
}

export function CECEvaluations({ courseCode }: { courseCode: string }) {
  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })
  const userIsStudent = useIsStudent()
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(
    null
  )

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

  if (!userIsStudent) {
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
    <Card hoverInteraction={false} className="min-h-screen">
      <CardContent>
        {/* Header */}
        <div className="mb-4">
          {/* chips of professors */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(groupedByProfessor).map(([professor, evals]) => {
              return (
                <div
                  key={professor}
                  className={cn(
                    "flex items-center gap-2 px-2.5 h-9 hover:bg-foreground/10 active:bg-foreground/15 rounded-lg border border-border shadow-sm hover:shadow-md cursor-pointer trans",
                    selectedProfessor === professor &&
                      "text-background bg-primary"
                  )}
                  role="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleProfessor(professor)
                  }}
                >
                  <span className="text-sm font-medium text-foreground/90">
                    {professor}
                  </span>
                  <div
                    className={cn(
                      "flex items-center justify-center size-5 bg-foreground/5 text-xs font-bold rounded-full shadow-sm text-muted-foreground",
                      selectedProfessor === professor &&
                        "text-foreground/80 bg-foreground/10"
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

        {selectedProfessor && (
          <div className="mb-4">
            <ProfessorEvalBlock
              professor={selectedProfessor}
              evals={groupedByProfessor[selectedProfessor]}
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
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CECEvaluations
