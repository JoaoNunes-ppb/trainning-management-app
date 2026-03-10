import { useMemo } from "react";
import { useCoaches } from "@/hooks/useCoaches";
import { useAthletes } from "@/hooks/useAthletes";
import { useCoachContext } from "@/context/CoachContext";
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
  selectedCoachId: string | undefined;
  onCoachChange: (coachId: string) => void;
  selectedAthleteId: string | undefined;
  onAthleteChange: (athleteId: string) => void;
}

const viewModes: { value: CalendarViewMode; label: string }[] = [
  { value: "all", label: "Todos os Atletas" },
  { value: "byCoach", label: "Por Treinador" },
  { value: "byAthlete", label: "Por Atleta" },
];

export default function CalendarFilterBar({
  viewMode,
  onViewModeChange,
  selectedCoachId,
  onCoachChange,
  selectedAthleteId,
  onAthleteChange,
}: CalendarFilterBarProps) {
  const { activeCoach } = useCoachContext();
  const { data: coaches } = useCoaches();
  const { data: athletes } = useAthletes(
    viewMode === "byAthlete" ? activeCoach?.id : undefined,
  );

  const coachItems = useMemo(
    () =>
      coaches?.reduce<Record<string, string>>(
        (acc, c) => ({ ...acc, [c.id]: c.name }),
        {},
      ) ?? {},
    [coaches],
  );

  const athleteItems = useMemo(
    () =>
      athletes?.reduce<Record<string, string>>(
        (acc, a) => ({ ...acc, [a.id]: a.name }),
        {},
      ) ?? {},
    [athletes],
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

      {viewMode === "byCoach" && (
        <Select
          value={selectedCoachId ?? null}
          onValueChange={(val) => {
            if (val) onCoachChange(val as string);
          }}
          items={coachItems}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar treinador..." />
          </SelectTrigger>
          <SelectContent>
            {coaches?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {viewMode === "byAthlete" && (
        <Select
          value={selectedAthleteId ?? null}
          onValueChange={(val) => {
            if (val) onAthleteChange(val as string);
          }}
          items={athleteItems}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar atleta..." />
          </SelectTrigger>
          <SelectContent>
            {athletes?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
