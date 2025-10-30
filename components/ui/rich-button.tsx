import { Button } from "./button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

type RichButtonProps = React.ComponentProps<typeof Button> & {
  tooltip?: string | React.ReactNode
  tooltipProps?: React.ComponentProps<typeof Tooltip>
  tooltipContentProps?: React.ComponentProps<typeof TooltipContent>
}

export function RichButton({
  children,
  className,
  tooltip,
  tooltipProps,
  tooltipContentProps,
  ...props
}: RichButtonProps) {
  const button = (
    <Button variant="outline" size="icon-sm" className={className} {...props}>
      {children}
    </Button>
  )
  if (!tooltip) {
    return button
  }
  return (
    <Tooltip {...tooltipProps}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent {...tooltipContentProps}>
        {typeof tooltip === "string" ? <p>{tooltip}</p> : tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
