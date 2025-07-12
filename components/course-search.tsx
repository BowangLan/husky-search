"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Course = {
  id: number
  code: string
  title: string
  description: string
  credit: string
  subject: string
  number: string
  quarters: string
  programCode: string | null
}

export function CourseSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.trim() === "") {
      setCourses([])
      return
    }

    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error("Search error:", error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  const handleSelect = (course: Course) => {
    setOpen(false)
    setQuery("")
    router.push(`/courses/${course.code}`)
  }

  const handleClear = () => {
    setQuery("")
    setCourses([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-80"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 opacity-50" />
            <span className="text-sm text-muted-foreground">
              {query || "Search courses..."}
            </span>
          </div>
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 sm:w-80" align="start">
        <Command>
          <CommandInput
            placeholder="Search courses..."
            value={query}
            onValueChange={setQuery}
            className="border-0 focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : "No courses found."}
            </CommandEmpty>
            <CommandGroup>
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.code}
                  onSelect={() => handleSelect(course)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{course.code}</span>
                      <span className="text-sm text-muted-foreground">
                        {course.credit} credits
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {course.title}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 