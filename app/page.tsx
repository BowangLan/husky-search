import { CourseService } from "@/services/course-service"
import { CourseCardLink } from "@/components/course-card"

export default async function IndexPage() {
  const courses = await CourseService.getAllCourses()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Explore{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                UW Courses
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Discover comprehensive course information, prerequisites, and detailed content 
              from the University of Washington's diverse academic departments.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{courses.length} courses available</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Live database</span>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Featured Courses
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse through our curated selection of courses from various departments.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found. Please check back later.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch justify-stretch">
              {courses.map((course) => (
                <CourseCardLink key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
