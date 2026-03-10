import { useState, useMemo, useCallback } from "react";
import { addWeeks, subWeeks, eachDayOfInterval, isSameDay, format } from "date-fns";
import { Plus } from "lucide-react";
import { useCoachContext } from "@/context/CoachContext";
import { useCalendarWorkouts } from "@/hooks/useCalendar";
import { useAthletes } from "@/hooks/useAthletes";
import { getWeekStart, getWeekEnd, formatDateParam } from "@/lib/dateUtils";
import { isOwner } from "@/lib/ownership";
import { Button } from "@/components/ui/button";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import CalendarHeader from "./CalendarHeader";
import CalendarFilterBar from "./CalendarFilterBar";
import DayColumn from "./DayColumn";
import { WeeklyCalendarSkeleton } from "./CalendarSkeleton";
import type { CalendarViewMode } from "@/types";

interface WeeklyCalendarProps {
  viewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
  selectedAthleteId?: string | undefined;
  onAthleteChange?: (id: string) => void;
}

export default function WeeklyCalendar({
  viewMode: externalViewMode,
  onViewModeChange: externalOnViewModeChange,
  selectedAthleteId: externalAthleteId,
  onAthleteChange: externalOnAthleteChange,
}: WeeklyCalendarProps = {}) {
  const { activeCoach } = useCoachContext();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(new Date()),
  );
  const [internalViewMode, setInternalViewMode] = useState<CalendarViewMode>("myAthletes");
  const [internalAthleteId, setInternalAthleteId] = useState<
    string | undefined
  >();

  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = externalOnViewModeChange ?? setInternalViewMode;
  const selectedAthleteId = externalAthleteId ?? internalAthleteId;
  const setSelectedAthleteId = externalOnAthleteChange ?? setInternalAthleteId;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const weekEnd = getWeekEnd(currentWeekStart);

  const filterCoachId = viewMode === "myAthletes" ? activeCoach?.id : undefined;
  const filterAthleteId =
    viewMode === "byAthlete" ? selectedAthleteId : undefined;

  const { data: workouts, isLoading } = useCalendarWorkouts(
    formatDateParam(currentWeekStart),
    formatDateParam(weekEnd),
    filterCoachId,
    filterAthleteId,
  );

  const { data: allAthletes } = useAthletes();

  const selectedAthleteBelongsToCoach = useMemo(() => {
    if (!selectedAthleteId || !activeCoach) return false;
    const athlete = allAthletes?.find((a) => a.id === selectedAthleteId);
    return athlete ? isOwner(athlete.coachId, activeCoach.id) : false;
  }, [selectedAthleteId, activeCoach, allAthletes]);

  const canCreate = useMemo(() => {
    if (viewMode === "myAthletes") return true;
    if (viewMode === "byAthlete" && selectedAthleteBelongsToCoach) return true;
    return false;
  }, [viewMode, selectedAthleteBelongsToCoach]);

  const days = useMemo(
    () => eachDayOfInterval({ start: currentWeekStart, end: weekEnd }),
    [currentWeekStart, weekEnd],
  );

  const workoutsByDay = useMemo(() => {
    const map = new Map<string, typeof workouts>();
    if (!workouts) return map;
    for (const day of days) {
      map.set(
        day.toISOString(),
        workouts.filter((w) => isSameDay(new Date(w.date + "T00:00:00"), day)),
      );
    }
    return map;
  }, [workouts, days]);

  const handlePrevWeek = useCallback(
    () => setCurrentWeekStart((d) => subWeeks(d, 1)),
    [],
  );
  const handleNextWeek = useCallback(
    () => setCurrentWeekStart((d) => addWeeks(d, 1)),
    [],
  );
  const handleToday = useCallback(
    () => setCurrentWeekStart(getWeekStart(new Date())),
    [],
  );

  const handleViewModeChange = useCallback(
    (mode: CalendarViewMode) => {
      setViewMode(mode);
    },
    [setViewMode],
  );

  const handleDayClick = useCallback((date: Date) => {
    setCreateDate(format(date, "yyyy-MM-dd"));
    setShowCreateDialog(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <CalendarHeader
            weekStart={currentWeekStart}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
          />
        </div>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => {
              setCreateDate(null);
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Treino
          </Button>
        )}
      </div>

      <CalendarFilterBar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        selectedAthleteId={selectedAthleteId}
        onAthleteChange={setSelectedAthleteId}
      />

      {isLoading ? (
        <WeeklyCalendarSkeleton />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              date={day}
              workouts={workoutsByDay.get(day.toISOString()) ?? []}
              onDayClick={handleDayClick}
              canCreate={canCreate}
              activeCoachId={activeCoach?.id}
            />
          ))}
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
