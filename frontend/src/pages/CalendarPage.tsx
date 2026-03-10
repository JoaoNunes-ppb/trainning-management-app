import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import MonthlyCalendar from "@/components/calendar/MonthlyCalendar";
import DailyCalendar from "@/components/calendar/DailyCalendar";
import type { CalendarTimeScale, CalendarViewMode } from "@/types";

const timeScales: { value: CalendarTimeScale; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export default function CalendarPage() {
  const [timeScale, setTimeScale] = useState<CalendarTimeScale>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [viewMode, setViewMode] = useState<CalendarViewMode>("myAthletes");
  const [selectedAthleteId, setSelectedAthleteId] = useState<
    string | undefined
  >();

  const handleViewModeChange = useCallback((mode: CalendarViewMode) => {
    setViewMode(mode);
  }, []);

  const handleMonthDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setTimeScale("day");
  }, []);

  const filterProps = {
    viewMode,
    onViewModeChange: handleViewModeChange,
    selectedAthleteId,
    onAthleteChange: setSelectedAthleteId,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center rounded-lg border border-border p-0.5 self-start">
        {timeScales.map(({ value, label }) => (
          <Button
            key={value}
            variant={timeScale === value ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeScale(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {timeScale === "day" && (
        <DailyCalendar
          date={selectedDate}
          onDateChange={setSelectedDate}
          {...filterProps}
        />
      )}
      {timeScale === "week" && <WeeklyCalendar {...filterProps} />}
      {timeScale === "month" && (
        <MonthlyCalendar onDayClick={handleMonthDayClick} {...filterProps} />
      )}
    </div>
  );
}
