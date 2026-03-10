import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkoutCard from "./WorkoutCard";
import type { WorkoutSummary } from "@/types";

interface DayColumnProps {
  date: Date;
  workouts: WorkoutSummary[];
  onDayClick: (date: Date) => void;
}

export default function DayColumn({
  date,
  workouts,
  onDayClick,
}: DayColumnProps) {
  const today = isToday(date);

  const sorted = useMemo(
    () =>
      [...workouts].sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime);
        if (a.scheduledTime) return -1;
        if (b.scheduledTime) return 1;
        return 0;
      }),
    [workouts],
  );

  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border border-border transition-colors",
        today
          ? "bg-primary/5 ring-2 ring-primary/25"
          : "bg-card hover:bg-accent/30",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center border-b border-border px-2 py-2",
          today && "bg-primary/10",
        )}
      >
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {format(date, "EEE", { locale: pt })}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
            today && "bg-primary text-primary-foreground",
          )}
        >
          {format(date, "d")}
        </span>
      </div>

      <div
        className="flex flex-1 cursor-pointer flex-col gap-1.5 p-1.5"
        onClick={(e) => {
          if (e.target === e.currentTarget) onDayClick(date);
        }}
      >
        {sorted.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}

        {sorted.length === 0 && (
          <button
            onClick={() => onDayClick(date)}
            className="flex flex-1 items-center justify-center text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
