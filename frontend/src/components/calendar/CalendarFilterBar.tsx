import { useMemo } from "react";
import { useAthletes } from "@/hooks/useAthletes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarViewMode } from "@/types";

interface CalendarFilterBarProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedAthleteId: string | undefined;
  onAthleteChange: (athleteId: string) => void;
}

const viewModes: { value: CalendarViewMode; label: string }[] = [
  { value: "myAthletes", label: "Os Meus Atletas" },
  { value: "all", label: "Todos os Atletas" },
  { value: "byAthlete", label: "Por Atleta" },
];

export default function CalendarFilterBar({
  viewMode,
  onViewModeChange,
  selectedAthleteId,
  onAthleteChange,
}: CalendarFilterBarProps) {
  const { data: allAthletes } = useAthletes();

  const athleteItems = useMemo(
    () =>
      allAthletes?.reduce<Record<string, string>>(
        (acc, a) => ({ ...acc, [a.id]: `${a.name} (${a.coachName})` }),
        {},
      ) ?? {},
    [allAthletes],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border p-0.5">
        {viewModes.map(({ value, label }) => (
          <Button
            key={value}
            variant={viewMode === value ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {viewMode === "byAthlete" && (
        <Select
          value={selectedAthleteId ?? null}
          onValueChange={(val) => {
            if (val) onAthleteChange(val as string);
          }}
          items={athleteItems}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecionar atleta..." />
          </SelectTrigger>
          <SelectContent>
            {allAthletes?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name} ({a.coachName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
