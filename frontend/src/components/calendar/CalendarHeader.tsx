import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWeekEnd } from "@/lib/dateUtils";

interface CalendarHeaderProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export default function CalendarHeader({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
}: CalendarHeaderProps) {
  const weekEnd = getWeekEnd(weekStart);

  const rangeLabel =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? `${format(weekStart, "MMM d", { locale: pt })} – ${format(weekEnd, "MMM d, yyyy", { locale: pt })}`
      : `${format(weekStart, "MMM d, yyyy", { locale: pt })} – ${format(weekEnd, "MMM d, yyyy", { locale: pt })}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoje
        </Button>
      </div>

      <h2 className="text-lg font-semibold">{rangeLabel}</h2>

      <div className="w-[140px]" />
    </div>
  );
}
