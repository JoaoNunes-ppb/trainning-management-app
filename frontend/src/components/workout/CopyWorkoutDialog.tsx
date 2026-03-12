import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useCopyWorkout } from "@/hooks/useWorkouts";
import type { WorkoutDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CopyWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWorkout: WorkoutDetail;
  onSuccess?: () => void;
}

export function CopyWorkoutDialog({
  open,
  onOpenChange,
  sourceWorkout,
  onSuccess,
}: CopyWorkoutDialogProps) {
  const navigate = useNavigate();
  const copyMutation = useCopyWorkout();

  const [date, setDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [label, setLabel] = useState(sourceWorkout.label);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDate("");
      setScheduledTime("");
      setLabel(sourceWorkout.label);
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    copyMutation.mutate(
      {
        sourceWorkoutId: sourceWorkout.id,
        data: {
          date,
          scheduledTime: scheduledTime ? `${scheduledTime}:00` : null,
          label: label.trim() || null,
        },
      },
      {
        onSuccess: (newWorkout) => {
          handleOpenChange(false);
          onSuccess?.();
          navigate(`/workouts/${newWorkout.id}`);
        },
      },
    );
  };

  const formattedSourceDate = format(
    parseISO(sourceWorkout.date),
    "d 'de' MMMM 'de' yyyy",
    { locale: pt },
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar Treino</DialogTitle>
          <DialogDescription>
            Copiar &ldquo;{sourceWorkout.label}&rdquo; de {formattedSourceDate}{" "}
            para uma nova data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copy-date">Nova Data *</Label>
            <Input
              id="copy-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copy-time">Hora</Label>
            <Input
              id="copy-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copy-label">Designação</Label>
            <Input
              id="copy-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={copyMutation.isPending || !date}
            >
              {copyMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Copiar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
