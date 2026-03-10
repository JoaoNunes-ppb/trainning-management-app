import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useUpsertResult, useDeleteResult } from "@/hooks/useExerciseResults";
import type { WorkoutExerciseDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ResultLoggerProps {
  workoutExercise: WorkoutExerciseDetail;
  workoutId: string;
}

export function ResultLogger({ workoutExercise, workoutId }: ResultLoggerProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const upsertMutation = useUpsertResult(workoutId);
  const deleteMutation = useDeleteResult(workoutId);

  const ex = workoutExercise.exercise;
  const result = workoutExercise.result;
  const hasResult = result !== null;

  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const openForm = () => {
    setSets(result?.sets?.toString() ?? "");
    setReps(result?.reps?.toString() ?? "");
    setWeight(result?.weight?.toString() ?? "");
    setDistance(result?.distance?.toString() ?? "");
    setTime(result?.time?.toString() ?? "");
    setNotes(result?.notes ?? "");
    setExpanded(true);
  };

  const toggleExpanded = () => {
    if (expanded) {
      setExpanded(false);
    } else {
      openForm();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(
      {
        workoutExerciseId: workoutExercise.id,
        data: {
          sets: ex.hasSets && sets ? Number(sets) : null,
          reps: ex.hasReps && reps ? Number(reps) : null,
          weight: ex.hasWeight && weight ? Number(weight) : null,
          distance: ex.hasDistance && distance ? Number(distance) : null,
          time: ex.hasTime && time ? Number(time) : null,
          notes: notes.trim() || null,
        },
      },
      { onSuccess: () => setExpanded(false) },
    );
  };

  const handleClear = () => {
    deleteMutation.mutate(workoutExercise.id, {
      onSuccess: () => {
        setConfirmClearOpen(false);
        setExpanded(false);
      },
    });
  };

  return (
    <>
      <div className="mt-2">
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {hasResult && !expanded && (
            <CheckCircle className="size-3.5 text-green-500" />
          )}
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          {hasResult ? "Editar Resultados" : "Registar Resultados"}
        </button>

        {expanded && (
          <form onSubmit={handleSave} className="mt-2 space-y-3 rounded-md border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 p-3">
            {ex.hasSets && (
              <div className="space-y-1">
                <Label htmlFor={`res-sets-${workoutExercise.id}`} className="text-xs">
                  Séries Realizadas
                </Label>
                <Input
                  id={`res-sets-${workoutExercise.id}`}
                  type="number"
                  min={0}
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {ex.hasReps && (
              <div className="space-y-1">
                <Label htmlFor={`res-reps-${workoutExercise.id}`} className="text-xs">
                  Repetições Realizadas
                </Label>
                <Input
                  id={`res-reps-${workoutExercise.id}`}
                  type="number"
                  min={0}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {ex.hasWeight && (
              <div className="space-y-1">
                <Label htmlFor={`res-weight-${workoutExercise.id}`} className="text-xs">
                  Peso Realizado (kg)
                </Label>
                <Input
                  id={`res-weight-${workoutExercise.id}`}
                  type="number"
                  min={0}
                  step="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {ex.hasDistance && (
              <div className="space-y-1">
                <Label htmlFor={`res-distance-${workoutExercise.id}`} className="text-xs">
                  Distância Realizada (m)
                </Label>
                <Input
                  id={`res-distance-${workoutExercise.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {ex.hasTime && (
              <div className="space-y-1">
                <Label htmlFor={`res-time-${workoutExercise.id}`} className="text-xs">
                  Tempo Realizado (s)
                </Label>
                <Input
                  id={`res-time-${workoutExercise.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor={`res-notes-${workoutExercise.id}`} className="text-xs">
                Notas
              </Label>
              <Textarea
                id={`res-notes-${workoutExercise.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                Cancelar
              </Button>
              {hasResult && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive hover:text-destructive"
                  onClick={() => setConfirmClearOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpar Resultados
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Limpar Resultados</DialogTitle>
            <DialogDescription>
              Remover resultados registados de "{workoutExercise.exerciseName}"? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
