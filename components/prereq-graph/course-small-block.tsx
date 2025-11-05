import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { Icons } from "../icons"

export function CourseSmallBlock({
  courseCode,
  className,
  ...props
}: { courseCode: string } & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        // "flex items-center gap-2 px-2",
        // // "hover:bg-accent hover:text-primary transition-colors cursor-pointer",
        // "text-sm font-medium"
        // buttonVariants({ variant: "secondary", size: "sm" }),
        "h-9 flex items-center gap-2 px-2 justify-start border border-transparent ring ring-transparent bg-secondary/70 hover:bg-secondary",
        "text-xs font-medium",
        className
      )}
      title={courseCode}
      {...props}
    >
      <Icons.course className="size-3.5" />
      <span className="truncate inline-block text-xs">{courseCode}</span>
      <div className="flex-1"></div>
    </div>
  )
}
