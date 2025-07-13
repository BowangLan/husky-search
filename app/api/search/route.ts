import { NextRequest, NextResponse } from "next/server"
import { and, eq, ilike, like, or } from "drizzle-orm"

import { CoursesTable, ProgramsTable, db } from "@/lib/db/schema"

const hasCourseCode = (query: string) => {
  return (
    (query.length >= 4 && query.match(/^[0-9]{3}$/)) ||
    query.match(/^ [0-9]{3}$/)
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim() === "") {
      return NextResponse.json({ courses: [] })
    }

    const q = query.trim()
    const qWithoutSpace = q.replace(/\s+/g, "")

    const courseCode = hasCourseCode(q) ? q : null

    const searchTerm = `%${q}%`

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
          ilike(CoursesTable.code, qWithoutSpace),
          ilike(CoursesTable.subject, `${q}%`)
          // ilike(CoursesTable.title, searchTerm),
          // ilike(CoursesTable.description, searchTerm),
          // ilike(CoursesTable.subject, searchTerm)
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
