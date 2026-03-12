import { useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOwner } from "@/lib/ownership";
import { formatDateParam } from "@/lib/dateUtils";
import WorkoutCard from "./WorkoutCard";
import type { WorkoutSummary } from "@/types";

interface DayColumnProps {
  date: Date;
  workouts: WorkoutSummary[];
  onDayClick: (date: Date) => void;
  canCreate: boolean;
  activeCoachId?: string;
  onDropWorkout?: (workoutId: string, targetDate: string) => void;
}

export default function DayColumn({
  date,
  workouts,
  onDayClick,
  canCreate,
  activeCoachId,
  onDropWorkout,
}: DayColumnProps) {
  const today = isToday(date);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const workoutId = e.dataTransfer.getData("workoutId");
    if (workoutId && onDropWorkout) {
      onDropWorkout(workoutId, formatDateParam(date));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border transition-colors",
        today
          ? "bg-primary/5 ring-2 ring-primary/25"
          : "bg-card hover:bg-accent/30",
        isDragOver
          ? "border-primary bg-primary/10 ring-2 ring-primary/40"
          : "border-border",
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
        className={cn(
          "flex flex-1 flex-col gap-1.5 p-1.5",
          canCreate && "cursor-pointer",
        )}
        onClick={(e) => {
          if (canCreate && e.target === e.currentTarget) onDayClick(date);
        }}
      >
        {sorted.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isOwner={isOwner(w.coachId, activeCoachId)}
          />
        ))}

        {canCreate && sorted.length === 0 && (
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
