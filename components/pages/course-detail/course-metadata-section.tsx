import { CourseDetail } from "@/convex/courses"
import { FileText, GraduationCap } from "lucide-react"

import { MyPlanCourseCodeGroupWithDetail } from "@/types/myplan"
import { capitalizeSingle } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export const parseDescription = (description: string) => {
  // Parse HTML tags and extract course codes from linkified spans
  return description
    .replace(/<span[^>]*data-text="([^"]*)"[^>]*\/>/g, "$1")
    .replace(/<[^>]*>/g, "")
}

const formatPrereqs = (prereqs: string[] | undefined) => {
  if (prereqs == null || prereqs === undefined || prereqs.length === 0)
    return "No prerequisites"
  return prereqs.join(", ")
}

const formatRawPrereqs = (prereqs: string[] | undefined) => {
  // [
  //   "A minimum grade of 2.0 in <span class=\"linkified\" data-id=\"df39e383-5abc-4454-9cf5-8aed65f05a48\" data-subject=\"PHYS\" data-number=\"321\"  data-title=\"Electromagnetism I\" data-text=\"PHYS 321\" />."
  // ]
  if (prereqs == null || prereqs === undefined || prereqs.length === 0)
    return "No prerequisites"

  return prereqs
    .map((prereq, index) => {
      return prereq.replace(
        /<span class="linkified"[^>]*data-subject="([^"]*)"[^>]*data-number="([^"]*)"[^>]*data-title="([^"]*)"[^>]*data-text="([^"]*)"[^>]*\/>/g,
        '<a href="/courses/$1 $2" class="underline hover:text-purple-500 trans" title="$3">$4</a>'
      )
    })
    .map((p) => p.split("; "))
    .flat()
    .map((p, index) => {
      let t = p.trim()
      if ("and" === t.trim()) {
        t = t.slice(3)
      }
      return <li key={index} dangerouslySetInnerHTML={{ __html: t }} />
    })
  // return <li key={index} dangerouslySetInnerHTML={{ __html: t }} />
}

export const CourseMetadataSectionCard = ({
  course,
}: {
  course: CourseDetail
}) => {
  return (
    <Card hoverInteraction={false}>
      <CardContent>
        <Section className="py-0">
          <SectionHeader border className="py-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">
                Prerequisites
              </h3>
            </div>
          </SectionHeader>
          <SectionContent className="py-3">
            {/* <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {formatPrereqs(course.myplanCourse?.prereqs)}
            </p> */}
            <div className="markdown">
              <ul className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
                {formatRawPrereqs(
                  course.myplanCourse?.detailData?.courseSummaryDetails
                    .requisites
                )}
              </ul>
            </div>
          </SectionContent>
        </Section>

        <Section className="py-0">
          <SectionHeader border className="py-3">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">
                Description
              </h3>
            </div>
          </SectionHeader>
          <SectionContent className="py-3">
            <div className="markdown">
              <p>
                {parseDescription(
                  course.myplanCourse?.detailData?.courseSummaryDetails
                    .courseDescription
                )}
              </p>
            </div>
          </SectionContent>
        </Section>
      </CardContent>
    </Card>
  )
}
