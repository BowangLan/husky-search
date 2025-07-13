import { NextRequest, NextResponse } from "next/server"
import { eq, ilike, or } from "drizzle-orm"
import { CoursesTable, db, ProgramsTable } from "@/lib/db/schema"

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
        programName: ProgramsTable.name,
      })
      .from(CoursesTable)
      .where(
        or(
          ilike(CoursesTable.code, searchTerm),
          ilike(CoursesTable.title, searchTerm),
          // ilike(CoursesTable.description, searchTerm),
          ilike(CoursesTable.subject, searchTerm)
        )
      )
      .leftJoin(ProgramsTable, eq(CoursesTable.programCode, ProgramsTable.code))
      .orderBy(CoursesTable.code)
      .limit(20)

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search courses" },
      { status: 500 }
    )
  }
} 