import * as React from "react"
import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("skeleton", className)} {...props} />
))
Skeleton.displayName = "Skeleton"

// Specialized skeleton variants for common UI patterns
function SkeletonLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 rounded", className)} {...props} />
}

function SkeletonCircle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("rounded-full", className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("rounded-xl border border-border", className)} {...props} />
}

function SkeletonTimelineItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-stretch gap-3 rounded-lg border border-border p-3", className)} {...props}>
      <div className="w-20 space-y-1">
        <Skeleton className="h-3 w-14 rounded" />
        <Skeleton className="h-2.5 w-10 rounded" />
      </div>
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
    </div>
  )
}

function SkeletonCalendarDay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-border p-2 space-y-2 min-h-[200px]", className)} {...props}>
      <Skeleton className="h-4 w-8 rounded" />
      <Skeleton className="h-6 w-full rounded" />
      <Skeleton className="h-6 w-3/4 rounded" />
      <Skeleton className="h-6 w-1/2 rounded" />
    </div>
  )
}

export { Skeleton, SkeletonLine, SkeletonCircle, SkeletonCard, SkeletonTimelineItem, SkeletonCalendarDay }
