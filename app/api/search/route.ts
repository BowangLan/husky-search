import { NextRequest, NextResponse } from "next/server"
import { like, or } from "drizzle-orm"
import { CoursesTable, db } from "@/lib/db/schema"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim() === "") {
      return NextResponse.json({ courses: [] })
    }

    const searchTerm = `%${query.trim()}%`

    const courses = await db
      .select({
        id: CoursesTable.id,
        code: CoursesTable.code,
        title: CoursesTable.title,
        description: CoursesTable.description,
        credit: CoursesTable.credit,
        subject: CoursesTable.subject,
        number: CoursesTable.number,
        quarters: CoursesTable.quarters,
        programCode: CoursesTable.programCode,
      })
      .from(CoursesTable)
      .where(
        or(
          like(CoursesTable.code, searchTerm),
          like(CoursesTable.title, searchTerm),
          like(CoursesTable.description, searchTerm),
          like(CoursesTable.subject, searchTerm)
        )
      )
      .orderBy(CoursesTable.code)
      .limit(10)

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search courses" },
      { status: 500 }
    )
  }
} 