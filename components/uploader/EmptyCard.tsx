import { cn } from "@/lib/utils"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

interface EmptyCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyCard({
  title,
  description,
  action,
  className,
  ...props
}: EmptyCardProps) {
  return (
    <Card
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 bg-transparent p-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action ? action : null}
    </Card>
  )
}