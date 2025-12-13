import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CoursePlanStudio } from "@/components/pages/plan/course-plan-studio"

export const metadata: Metadata = {
  title: "Course Plan Studio | Husky Search",
  description: "Plan your courses across multiple quarters at UW",
}

export default async function CoursePlanPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/plan")
  }

  return <CoursePlanStudio />
}
