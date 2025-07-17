import { NextRequest, NextResponse } from "next/server"
import { CourseService } from "@/services/course-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = searchParams.get("page")
    const pageNumber = page ? (isNaN(parseInt(page)) ? 1 : parseInt(page)) : 1

    if (!query || query.trim() === "") {
      return NextResponse.json({ courses: [] })
    }

    const q = query.trim()
    const courses = await CourseService.search(q, {
      page: pageNumber,
      pageSize: 20,
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search courses" },
      { status: 500 }
    )
  }
}
