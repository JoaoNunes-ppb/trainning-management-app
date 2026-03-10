import { useState } from "react";
import { Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useUpdateExercise, useDeleteExercise } from "@/hooks/useWorkoutExercises";
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
import { Card, CardContent } from "@/components/ui/card";
import { ResultLogger } from "@/components/result/ResultLogger";

interface WorkoutExerciseItemProps {
  workoutExercise: WorkoutExerciseDetail;
  workoutId: string;
}

function formatValues(
  we: WorkoutExerciseDetail,
  mode: "expected" | "actual",
): string {
  const parts: string[] = [];
  const ex = we.exercise;
  const r = we.result;

  if (mode === "expected") {
    if (ex.hasSets && we.setsExpected != null) parts.push(`${we.setsExpected} séries`);
    if (ex.hasReps && we.repsExpected != null) parts.push(`${we.repsExpected} reps`);
    if (ex.hasWeight && we.weightExpected != null) parts.push(`${we.weightExpected} kg`);
    if (ex.hasDistance && we.distanceExpected != null) parts.push(`${we.distanceExpected} m`);
    if (ex.hasTime && we.timeExpected != null) parts.push(`${we.timeExpected} s`);
  } else if (r) {
    if (ex.hasSets && r.sets != null) parts.push(`${r.sets} séries`);
    if (ex.hasReps && r.reps != null) parts.push(`${r.reps} reps`);
    if (ex.hasWeight && r.weight != null) parts.push(`${r.weight} kg`);
    if (ex.hasDistance && r.distance != null) parts.push(`${r.distance} m`);
    if (ex.hasTime && r.time != null) parts.push(`${r.time} s`);
  }

  if (parts.length === 0) return mode === "expected" ? "Sem objetivos definidos" : "";
  if (parts.length <= 2) return parts.join(" \u00d7 ");
  const [first, ...rest] = parts;
  return `${first} \u00d7 ${rest.slice(0, 1).join("")}${rest.length > 1 ? " @ " + rest.slice(1).join(", ") : ""}`;
}

export function WorkoutExerciseItem({ workoutExercise, workoutId }: WorkoutExerciseItemProps) {
  const updateMutation = useUpdateExercise(workoutId);
  const deleteMutation = useDeleteExercise(workoutId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const ex = workoutExercise.exercise;

  const openEdit = () => {
    setSets(workoutExercise.setsExpected?.toString() ?? "");
    setReps(workoutExercise.repsExpected?.toString() ?? "");
    setWeight(workoutExercise.weightExpected?.toString() ?? "");
    setDistance(workoutExercise.distanceExpected?.toString() ?? "");
    setTime(workoutExercise.timeExpected?.toString() ?? "");
    setNotes(workoutExercise.notes ?? "");
    setEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: workoutExercise.id,
        orderIndex: workoutExercise.orderIndex,
        notes: notes.trim() || null,
        setsExpected: ex.hasSets && sets ? Number(sets) : null,
        repsExpected: ex.hasReps && reps ? Number(reps) : null,
        weightExpected: ex.hasWeight && weight ? Number(weight) : null,
        distanceExpected: ex.hasDistance && distance ? Number(distance) : null,
        timeExpected: ex.hasTime && time ? Number(time) : null,
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(workoutExercise.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  return (
    <>
      <Card size="sm">
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {workoutExercise.result && (
                  <CheckCircle className="size-4 text-green-500 shrink-0" />
                )}
                <p className="font-semibold">{workoutExercise.exerciseName}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Previsto:</span>{" "}
                {formatValues(workoutExercise, "expected")}
              </p>

              {workoutExercise.result && formatValues(workoutExercise, "actual") && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  <span className="font-medium">Realizado:</span>{" "}
                  {formatValues(workoutExercise, "actual")}
                </p>
              )}

              {workoutExercise.notes && (
                <p className="text-xs text-muted-foreground italic mt-1">{workoutExercise.notes}</p>
              )}

              <ResultLogger workoutExercise={workoutExercise} workoutId={workoutId} />
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon-xs" onClick={openEdit}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {workoutExercise.exerciseName}</DialogTitle>
            <DialogDescription>Atualizar valores previstos e notas.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            {ex.hasSets && (
              <div className="space-y-2">
                <Label htmlFor="edit-sets">Séries</Label>
                <Input
                  id="edit-sets"
                  type="number"
                  min={0}
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                />
              </div>
            )}

            {ex.hasReps && (
              <div className="space-y-2">
                <Label htmlFor="edit-reps">Repetições</Label>
                <Input
                  id="edit-reps"
                  type="number"
                  min={0}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>
            )}

            {ex.hasWeight && (
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Peso (kg)</Label>
                <Input
                    id="edit-weight"
                    type="number"
                    min={0}
                    step="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            )}

            {ex.hasDistance && (
              <div className="space-y-2">
                <Label htmlFor="edit-distance">Distância (m)</Label>
                <Input
                  id="edit-distance"
                  type="number"
                  min={0}
                  step="0.01"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            )}

            {ex.hasTime && (
              <div className="space-y-2">
                <Label htmlFor="edit-time">Tempo (s)</Label>
                <Input
                  id="edit-time"
                  type="number"
                  min={0}
                  step="0.01"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-ex-notes">Notas</Label>
              <Textarea
                id="edit-ex-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Exercício</DialogTitle>
            <DialogDescription>
              Remover "{workoutExercise.exerciseName}" deste treino? Os resultados registados também
              serão eliminados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
