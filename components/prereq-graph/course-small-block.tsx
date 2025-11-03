import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
        "flex items-center gap-2 px-2 justify-start bg-secondary/70 hover:bg-secondary",
        "text-xs font-medium",
        className
      )}
      title={courseCode}
      {...props}
    >
      <span className="truncate inline-block text-xs">{courseCode}</span>
      <div className="flex-1"></div>
    </div>
  )
}
