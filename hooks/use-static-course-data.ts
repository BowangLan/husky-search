import { useEffect, useState } from "react"
import { STATIC_ASSETS } from "@/config/site"

export function useStaticCourseCodes() {
  const [courseCodes, setCourseCodes] = useState<string[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchCourseCodes() {
      try {
        setIsLoading(true)
        const response = await fetch(`/${STATIC_ASSETS.ALL_COURSE_CODES}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch course codes: ${response.statusText}`)
        }

        const data = await response.json()

        if (isMounted) {
          setCourseCodes(Array.isArray(data) ? data : [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          setCourseCodes([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCourseCodes()

    return () => {
      isMounted = false
    }
  }, [])

  return { data: courseCodes, isLoading, error }
}

export interface SubjectArea {
  code: string
  title: string
}

export function useStaticSubjectAreas() {
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchSubjectAreas() {
      try {
        setIsLoading(true)
        const response = await fetch(`/${STATIC_ASSETS.ALL_SUBJECT_AREAS}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch subject areas: ${response.statusText}`)
        }

        const data = await response.json()

        if (isMounted) {
          // Handle both compressed string format and object format
          if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'string') {
              // Compressed format: ["CODE_TITLE", ...]
              const parsed = data.map(item => {
                const parts = item.split('_')
                const code = parts[0]
                const title = parts.slice(1).join('_') // Handle titles with underscores
                return { code, title }
              })
              setSubjectAreas(parsed)
            } else if (data.length > 0 && typeof data[0] === 'object' && 'code' in data[0]) {
              // Object format: [{code: "CODE", title: "TITLE"}, ...]
              setSubjectAreas(data)
            } else {
              setSubjectAreas([])
            }
          } else {
            setSubjectAreas([])
          }
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          setSubjectAreas([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSubjectAreas()

    return () => {
      isMounted = false
    }
  }, [])

  return { data: subjectAreas, isLoading, error }
}