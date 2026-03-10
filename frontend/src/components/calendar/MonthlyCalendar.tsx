import { useState, useMemo, useCallback } from "react";
import {
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarWorkouts } from "@/hooks/useCalendar";
import {
  getMonthStart,
  getMonthEnd,
  getWeekStart,
  getWeekEnd,
  formatDateParam,
} from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import CalendarFilterBar from "./CalendarFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarViewMode, WorkoutSummary } from "@/types";

interface MonthlyCalendarProps {
  onDayClick: (date: Date) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedCoachId: string | undefined;
  onCoachChange: (id: string) => void;
  selectedAthleteId: string | undefined;
  onAthleteChange: (id: string) => void;
}

const DAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const statusColor: Record<string, string> = {
  COMPLETED: "bg-green-500",
  MISSED: "bg-red-500",
  PENDING: "bg-primary",
};

export default function MonthlyCalendar({
  onDayClick,
  viewMode,
  onViewModeChange,
  selectedCoachId,
  onCoachChange,
  selectedAthleteId,
  onAthleteChange,
}: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthStart = getMonthStart(currentMonth);
  const monthEnd = getMonthEnd(currentMonth);
  const gridStart = getWeekStart(monthStart);
  const gridEnd = getWeekEnd(monthEnd);

  const filterCoachId = viewMode === "byCoach" ? selectedCoachId : undefined;
  const filterAthleteId =
    viewMode === "byAthlete" ? selectedAthleteId : undefined;

  const { data: workouts, isLoading } = useCalendarWorkouts(
    formatDateParam(gridStart),
    formatDateParam(gridEnd),
    filterCoachId,
    filterAthleteId,
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart.getTime(), gridEnd.getTime()],
  );

  const workoutsByDay = useMemo(() => {
    const map = new Map<string, WorkoutSummary[]>();
    if (!workouts) return map;
    for (const day of days) {
      const key = formatDateParam(day);
      map.set(
        key,
        workouts.filter((w) => isSameDay(new Date(w.date + "T00:00:00"), day)),
      );
    }
    return map;
  }, [workouts, days]);

  const handlePrev = useCallback(
    () => setCurrentMonth((d) => subMonths(d, 1)),
    [],
  );
  const handleNext = useCallback(
    () => setCurrentMonth((d) => addMonths(d, 1)),
    [],
  );
  const handleToday = useCallback(() => setCurrentMonth(new Date()), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: pt })}
        </h2>
        <div className="w-[140px]" />
      </div>

      <CalendarFilterBar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        selectedCoachId={selectedCoachId}
        onCoachChange={onCoachChange}
        selectedAthleteId={selectedAthleteId}
        onAthleteChange={onAthleteChange}
      />

      {isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium uppercase text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="flex min-h-[90px] flex-col items-start border-b border-r border-border p-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                {i % 4 === 0 && <Skeleton className="mt-auto h-2 w-8" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = formatDateParam(day);
              const dayWorkouts = workoutsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => onDayClick(day)}
                  className={`flex min-h-[90px] flex-col items-start border-b border-r border-border p-2 text-left transition-colors hover:bg-accent/40 ${
                    !inMonth ? "bg-muted/30 text-muted-foreground/50" : ""
                  }`}
                >
                  <span
                    className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                      today
                        ? "bg-primary text-primary-foreground"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {dayWorkouts.length > 0 && (
                    <div className="mt-auto flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1">
                        {dayWorkouts.slice(0, 5).map((w) => (
                          <span
                            key={w.id}
                            className={`h-2 w-2 rounded-full ${statusColor[w.status] ?? "bg-gray-400"}`}
                            title={`${w.label} (${w.status.toLowerCase()})`}
                          />
                        ))}
                      </div>
                      {dayWorkouts.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayWorkouts.length - 5} mais
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {dayWorkouts.length} treino
                        {dayWorkouts.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
