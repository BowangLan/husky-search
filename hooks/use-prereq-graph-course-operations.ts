import { useEffect, useState, useRef } from "react"
import { usePrereqGraphUrlParams } from "./use-prereq-graph-url-params"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"

export const usePrereqGraphAddCourse = () => {
  const { isCourseAdded, addCourses: addCoursesToUrl } = usePrereqGraphUrlParams()
  const [addingSet, setAddingSet] = useState<Set<string>>(new Set())
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set())
  const isFetchingRef = useRef(false)
  const fetchCourses = useMutation(api.courses.listOverviewByCourseCodesMutation)

  const addCourse = (courseCode: string) => {    // Normalize course code
    const normalized = courseCode.replace(/\s+/g, " ").toUpperCase()

    // Key log for attempted add
    console.log("[usePrereqGraphAddCourse] addCourse called", { courseCode, normalized })

    if (isCourseAdded(normalized)) {
      console.log("[usePrereqGraphAddCourse] Course already added", { normalized })
      return
    }

    setAddingSet((prev) => {
      if (prev.has(normalized)) {
        console.log("[usePrereqGraphAddCourse] Already in addingSet, skipping", { normalized })
        return prev
      }
      const newSet = new Set(prev)
      newSet.add(normalized)
      console.log("[usePrereqGraphAddCourse] Added to addingSet", { normalized, newSet: Array.from(newSet) })
      return newSet
    })

    setLoadingSet((prev) => {
      if (prev.has(normalized)) {
        console.log("[usePrereqGraphAddCourse] Already in loadingSet, skipping", { normalized })
        return prev
      }
      const newSet = new Set(prev)
      newSet.add(normalized)
      console.log("[usePrereqGraphAddCourse] Added to loadingSet", { normalized, newSet: Array.from(newSet) })
      return newSet
    })
  }

  useEffect(() => {
    if (addingSet.size === 0 || isFetchingRef.current) return

    isFetchingRef.current = true

    const f = async () => {
      const coursesToFetch = Array.from(addingSet)
      console.log("[usePrereqGraphAddCourse] Fetching courses", { coursesToFetch })

      try {
        const fullCourses = await fetchCourses({
          courseCodes: coursesToFetch,
          prereqLevel: 1,
        })
        console.log("[usePrereqGraphAddCourse] Fetched courses", { result: fullCourses })

        addCoursesToUrl(new Set(coursesToFetch))
        console.log("[usePrereqGraphAddCourse] Added fetched courses to URL", { keys: coursesToFetch })

        setLoadingSet((prev) => {
          const newSet = new Set(prev)
          coursesToFetch.forEach((code) => newSet.delete(code))
          console.log("[usePrereqGraphAddCourse] Removed successfully fetched courses from loadingSet", {
            removed: coursesToFetch,
            newSet: Array.from(newSet),
          })
          return newSet
        })

        useInteractivePrereqGraphState.getState().setCourses(Object.values(fullCourses))
        console.log("[usePrereqGraphAddCourse] Updated interactive prereq graph store with new courses")
      } catch (error) {
        setLoadingSet((prev) => {
          const newSet = new Set(prev)
          coursesToFetch.forEach((code) => newSet.delete(code))
          console.log("[usePrereqGraphAddCourse] Error fetching courses, removed from loadingSet", {
            error,
            removed: coursesToFetch,
            newSet: Array.from(newSet),
          })
          return newSet
        })
      } finally {
        setAddingSet((prev) => {
          const newSet = new Set(prev)
          coursesToFetch.forEach((code) => newSet.delete(code))
          console.log("[usePrereqGraphAddCourse] Cleaned up addingSet", {
            removed: coursesToFetch,
            newSet: Array.from(newSet),
          })
          return newSet
        })
        isFetchingRef.current = false
      }
    }

    f()
  }, [addingSet, fetchCourses, addCoursesToUrl])

  return {
    addCourse,
    loadingCourseCodes: loadingSet,
    canAdd: isCourseAdded,
  }
}

export const usePrereqGraphRemoveCourse = ({
  isPrimaryCourse = false,
}: {
  isPrimaryCourse?: boolean
} = {}) => {
  const { removeCourse: removeCourseFromUrl } = usePrereqGraphUrlParams()
  const removeCourse = (courseCode: string) => {
    useInteractivePrereqGraphState.getState().removeCourse(courseCode)

    if (isPrimaryCourse) {
      removeCourseFromUrl(courseCode)
    }
  }

  return {
    removeCourse,
  }
}
