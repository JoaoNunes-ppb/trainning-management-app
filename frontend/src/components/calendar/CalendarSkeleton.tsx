import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyCalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[200px] flex-col rounded-lg border border-border bg-card"
        >
          <div className="flex flex-col items-center border-b border-border px-2 py-2 gap-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-1.5">
            {i % 3 !== 2 && <Skeleton className="h-16 w-full rounded-md" />}
            {i % 2 === 0 && <Skeleton className="h-16 w-full rounded-md" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DailyCalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border">
        <div className="border-b border-border bg-muted/50 px-4 py-2">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border bg-muted/50 px-4 py-2">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex min-h-[60px]">
              <div className="flex w-16 shrink-0 items-start justify-end border-r border-border pr-3 pt-2">
                <Skeleton className="h-3.5 w-10" />
              </div>
              <div className="flex flex-1 flex-wrap gap-2 p-2">
                {i % 3 === 0 && (
                  <Skeleton className="h-16 w-full max-w-xs rounded-md" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
