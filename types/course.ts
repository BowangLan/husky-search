export type Course = {
  id: string
  title: string
  description: string
  level: string
  subjects: string
  code: string
  credits: number | number[]
  tags: string[]
  isFeatured: boolean
  imageUrl: string
}

export type DatabaseCourse = {
  id: number
  code: string
  title: string
  description: string
  credit: string
  subject: string
  number: string
  quarters: string
  programCode: string | null
  programName: string | null
}
