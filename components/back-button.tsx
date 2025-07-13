"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "./ui/button"

export const BackButton = () => {
  const navigate = useRouter()

  return (
    <Button
      variant="ghost"
      className="gap-2 text-muted-foreground hover:opacity-80 px-0 has-[>svg]:px-0"
      onClick={() => navigate.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  )
}
