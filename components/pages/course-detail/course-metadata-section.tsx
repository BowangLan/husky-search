import { CourseDetail } from "@/convex/courses"

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

export const CourseMetadataSectionCard = ({
  course,
}: {
  // course: MyPlanCourseCodeGroupWithDetail
  course: CourseDetail
}) => {
  return (
    <Card hoverInteraction={false}>
      <CardContent>
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
              {/* {course.data[0]!.data.prereqs
              ? capitalizeSingle(course.data[0]!.data.prereqs)
              : "No prerequisites"} */}
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
