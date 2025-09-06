import { CourseDetail } from "@/convex/courses"
import { FileText, GraduationCap } from "lucide-react"

import { MyPlanCourseCodeGroupWithDetail } from "@/types/myplan"
import { capitalizeSingle } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export const CourseMetadataSection = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  return (
    <>
      <Section>
        <SectionHeader border>
          <div className="flex items-center gap-2">
            {/* <GraduationCap className="h-4 w-4 text-muted-foreground" /> */}
            <h3 className="text-sm text-muted-foreground font-medium">
              Prerequisites
            </h3>
          </div>
        </SectionHeader>
        <SectionContent>
          <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
            {course.data[0]!.data.prereqs
              ? capitalizeSingle(course.data[0]!.data.prereqs)
              : "No prerequisites"}
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader border>
          <div className="flex items-center gap-2">
            {/* <GraduationCap className="h-4 w-4 text-muted-foreground" /> */}
            <h3 className="text-sm text-muted-foreground font-medium">
              Description
            </h3>
          </div>
        </SectionHeader>
        <SectionContent>
          <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
            {course.detail?.courseSummaryDetails.courseDescription}
          </p>
        </SectionContent>
      </Section>
    </>
  )
}

const formatPrereqs = (prereqs: string[] | string | undefined) => {
  if (!prereqs) return "No prerequisites"
  if (typeof prereqs === "string") return capitalizeSingle(prereqs)
  return prereqs
    .map((prereq) => {
      return prereq.split(" ")[0]
    })
    .join(", ")
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
          <SectionHeader border className="py-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">
                Prerequisites
              </h3>
            </div>
          </SectionHeader>
          <SectionContent className="py-2">
            <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {formatPrereqs(course.myplanCourse?.prereqs)}
            </p>
          </SectionContent>
        </Section>

        <Section className="py-0">
          <SectionHeader border className="py-2">
            <div className="flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">
                Description
              </h3>
            </div>
          </SectionHeader>
          <SectionContent className="py-2">
            <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {
                course.myplanCourse?.detailData?.courseSummaryDetails
                  .courseDescription
              }
            </p>
          </SectionContent>
        </Section>
      </CardContent>
    </Card>
  )
}
