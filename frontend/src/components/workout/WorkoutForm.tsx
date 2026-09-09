import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useAthletes } from "@/hooks/useAthletes";
import { useCreateWorkout } from "@/hooks/useWorkouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface WorkoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string | null;
  onSuccess?: () => void;
}

export function WorkoutForm({
  open,
  onOpenChange,
  defaultDate,
  onSuccess,
}: WorkoutFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <WorkoutFormContent
          defaultDate={defaultDate}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
}

function WorkoutFormContent({
  onOpenChange,
  defaultDate,
  onSuccess,
}: Omit<WorkoutFormProps, "open">) {
  const { data: athletes } = useAthletes();
  const createMutation = useCreateWorkout();

  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const athleteItems = useMemo(
    () =>
      athletes?.reduce<Record<string, string>>(
        (acc, a) => ({ ...acc, [a.id]: a.name }),
        {},
      ) ?? {},
    [athletes],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!athleteId || !label.trim() || !date) return;

    createMutation.mutate(
      {
        athleteId,
        label: label.trim(),
        date,
        scheduledTime: scheduledTime ? `${scheduledTime}:00` : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Treino</DialogTitle>
          <DialogDescription>
            Criar um treino para qualquer atleta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Atleta *</Label>
            <Select
              value={athleteId}
              onValueChange={(val) => {
                if (val) setAthleteId(val as string);
              }}
              items={athleteItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar atleta" />
              </SelectTrigger>
              <SelectContent>
                {athletes?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} — {a.coachName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-label">Título *</Label>
            <Input
              id="workout-label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex. Treino de Força Superior"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-date">Data *</Label>
            <Input
              id="workout-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-time">Hora</Label>
            <Input
              id="workout-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notas</Label>
            <Textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionais..."
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={createMutation.isPending || !athleteId || !label.trim() || !date}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Criar Treino
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  );
}
