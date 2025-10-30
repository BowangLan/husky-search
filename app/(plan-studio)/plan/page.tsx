import { Metadata } from "next"
import { CoursePlanStudio } from "@/components/pages/plan/course-plan-studio"

export const metadata: Metadata = {
  title: "Course Plan Studio | Husky Search",
  description: "Plan your courses across multiple quarters at UW",
}

export default function CoursePlanPage() {
  return <CoursePlanStudio />
}
