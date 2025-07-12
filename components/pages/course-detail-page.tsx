import { Course, DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Clock, Users, Tag } from "lucide-react"
import Link from "next/link"

export function CourseDetailPage({ course }: { course: Course | DatabaseCourse }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {'level' in course ? course.level : course.subject}
            </Badge>
            <Badge variant="outline" className="border-border/50">
              {'subjects' in course ? course.subjects : course.subject}
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-4">
            {course.title}
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
            {course.description}
          </p>
        </div>

        {/* Course Details Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Credits</p>
                      <p className="font-semibold">{'credits' in course ? course.credits : course.credit} credits</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="font-semibold">{'level' in course ? course.level : course.subject}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Course Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {'tags' in course ? (
                      course.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="border-border/50 bg-background/50 hover:bg-background/80 transition-colors duration-200"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <>
                        <Badge 
                          variant="outline" 
                          className="border-border/50 bg-background/50 hover:bg-background/80 transition-colors duration-200"
                        >
                          {course.subject}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="border-border/50 bg-background/50"
                        >
                          {course.number}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed course content and curriculum information will be displayed here.
                  This section can include modules, topics, learning objectives, and more.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Code Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course Code</p>
                  <p className="font-mono font-semibold text-lg">{course.code}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{'subjects' in course ? course.subjects : course.subject}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="font-semibold">{'credits' in course ? course.credits : course.credit} credits</p>
                </div>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Prerequisites and requirements for this course will be listed here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
