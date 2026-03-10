import { useMemo, useState, useCallback } from "react";
import { addDays, subDays, isToday, format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendarWorkouts } from "@/hooks/useCalendar";
import { formatDateParam } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import CalendarFilterBar from "./CalendarFilterBar";
import WorkoutCard from "./WorkoutCard";
import { DailyCalendarSkeleton } from "./CalendarSkeleton";
import type { CalendarViewMode, WorkoutSummary } from "@/types";

interface DailyCalendarProps {
  date: Date;
  onDateChange: (date: Date) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedCoachId: string | undefined;
  onCoachChange: (id: string) => void;
  selectedAthleteId: string | undefined;
  onAthleteChange: (id: string) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 – 22:00

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function DailyCalendar({
  date,
  onDateChange,
  viewMode,
  onViewModeChange,
  selectedCoachId,
  onCoachChange,
  selectedAthleteId,
  onAthleteChange,
}: DailyCalendarProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const dateStr = formatDateParam(date);

  const filterCoachId = viewMode === "byCoach" ? selectedCoachId : undefined;
  const filterAthleteId =
    viewMode === "byAthlete" ? selectedAthleteId : undefined;

  const { data: workouts, isLoading } = useCalendarWorkouts(
    dateStr,
    dateStr,
    filterCoachId,
    filterAthleteId,
  );

  const { unscheduled, byHour } = useMemo(() => {
    const unsched: WorkoutSummary[] = [];
    const hourMap = new Map<number, WorkoutSummary[]>();

    if (!workouts) return { unscheduled: unsched, byHour: hourMap };

    for (const w of workouts) {
      if (!w.scheduledTime) {
        unsched.push(w);
      } else {
        const hour = parseInt(w.scheduledTime.slice(0, 2), 10);
        const existing = hourMap.get(hour) ?? [];
        existing.push(w);
        hourMap.set(hour, existing);
      }
    }
    return { unscheduled: unsched, byHour: hourMap };
  }, [workouts]);

  const handlePrev = useCallback(
    () => onDateChange(subDays(date, 1)),
    [date, onDateChange],
  );
  const handleNext = useCallback(
    () => onDateChange(addDays(date, 1)),
    [date, onDateChange],
  );
  const handleToday = useCallback(
    () => onDateChange(new Date()),
    [onDateChange],
  );

  const handleSlotClick = useCallback(() => {
    setCreateDate(dateStr);
    setShowCreateDialog(true);
  }, [dateStr]);

  const today = isToday(date);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center justify-between">
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
            {format(date, "EEEE, MMMM d, yyyy", { locale: pt })}
            {today && (
              <span className="ml-2 text-sm font-normal text-primary">
                (Hoje)
              </span>
            )}
          </h2>
          <div className="w-[140px]" />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreateDate(dateStr);
            setShowCreateDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Treino
        </Button>
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
        <DailyCalendarSkeleton />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Unscheduled section */}
          <div className="rounded-lg border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Sem horário
              </h3>
            </div>
            <div className="p-3">
              {unscheduled.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {unscheduled.map((w) => (
                    <WorkoutCard key={w.id} workout={w} />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Sem treinos por agendar
                </p>
              )}
            </div>
          </div>

          {/* Time grid */}
          <div className="rounded-lg border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Horário
              </h3>
            </div>
            <div className="divide-y divide-border">
              {HOURS.map((hour) => {
                const hourWorkouts = byHour.get(hour) ?? [];
                return (
                  <div
                    key={hour}
                    className="group flex min-h-[60px] cursor-pointer transition-colors hover:bg-accent/30"
                    onClick={(e) => {
                      if (e.target === e.currentTarget || hourWorkouts.length === 0)
                        handleSlotClick();
                    }}
                  >
                    <div className="flex w-16 shrink-0 items-start justify-end border-r border-border pr-3 pt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {hourLabel(hour)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2 p-2">
                      {hourWorkouts.map((w) => (
                        <div key={w.id} className="w-full max-w-xs">
                          <WorkoutCard workout={w} />
                        </div>
                      ))}
                      {hourWorkouts.length === 0 && (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <WorkoutForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        defaultDate={createDate}
      />
    </div>
  );
}
