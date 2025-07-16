import { NextRequest, NextResponse } from "next/server"
import { and, eq, ilike, like, or } from "drizzle-orm"

import { CoursesTable, ProgramsTable, db } from "@/lib/db/schema"

const extractNumber = (query: string) => {
  // return the first sequence of numbers {1:3}
  return (
    query
      .match(/\d{1,3}/)?.[0]
      .replace(/\D/g, "")
      .trim() ?? null
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
    const qWithoutNumber = q.replace(/\d/g, "").trim()

    const courseCode = extractNumber(q)

    const searchTerm = `%${q}%`

    console.log("Course Code:", courseCode)

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
          // ilike(CoursesTable.code, qWithoutSpace),
          and(
            ilike(CoursesTable.subject, `${qWithoutNumber}%`),
            like(CoursesTable.number, courseCode ? `${courseCode}%` : "%%")
          )
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
