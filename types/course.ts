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
