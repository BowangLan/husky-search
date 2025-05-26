import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export interface Course {
  id: string
  title: string
  instructor: string
  description: string
  price: number
  rating: number
  reviewCount: number
  duration: string
  level: string
  category: string
  tags: string[]
  isFeatured: boolean
  imageUrl: string
}

export function CourseCard({
  title,
  instructor,
  description,
  price,
  rating,
  reviewCount,
  duration,
  level,
  category,
  tags,
  imageUrl,
}: Course) {
  return (
    <Card className="group h-full cursor-pointer border-2 border-border text-main-foreground shadow-shadow py-0 space-y-0 gap-0 transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none overflow-hidden">
      <div className="relative aspect-video w-full hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Badge variant="neutral">{level}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <span>⭐️ {rating}</span>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg leading-6 line-clamp-2">{title}</h3>
          {/* <p className="text-sm text-muted-foreground">
            by {instructor} • {duration}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p> */}
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
