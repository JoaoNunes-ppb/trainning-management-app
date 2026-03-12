import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { useAddExercise } from "@/hooks/useWorkoutExercises";
import type { Exercise } from "@/types";
import { exerciseDisplayName } from "@/lib/exerciseUtils";
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

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  currentExerciseCount: number;
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  workoutId,
  currentExerciseCount,
}: AddExerciseDialogProps) {
  const { data: exercises } = useExercises();
  const addMutation = useAddExercise(workoutId);

  const exerciseItems = useMemo(
    () =>
      exercises?.reduce<Record<string, string>>(
        (acc, e) => ({ ...acc, [e.id]: exerciseDisplayName(e.name, e.modality, e.kineoType) }),
        {},
      ) ?? {},
    [exercises],
  );

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [concentricLoad, setConcentricLoad] = useState("");
  const [eccentricLoad, setEccentricLoad] = useState("");
  const [isometricLoad, setIsometricLoad] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedExercise(null);
      setSets("");
      setReps("");
      setWeight("");
      setDistance("");
      setTime("");
      setNotes("");
      setConcentricLoad("");
      setEccentricLoad("");
      setIsometricLoad("");
      setValidationError(null);
    }
  }, [open]);

  const handleExerciseSelect = (exerciseId: string | null) => {
    const ex = exerciseId ? (exercises?.find((e) => e.id === exerciseId) ?? null) : null;
    setSelectedExercise(ex);
    setSets("");
    setReps("");
    setWeight("");
    setDistance("");
    setTime("");
    setConcentricLoad("");
    setEccentricLoad("");
    setIsometricLoad("");
    setValidationError(null);
  };

  const isKineo = selectedExercise?.modality === "KINEO";
  const kineoType = selectedExercise?.kineoType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    if (isKineo) {
      if (kineoType === "ISOMETRICO" && !isometricLoad) {
        setValidationError("Carga isométrica é obrigatória.");
        return;
      }
      if (kineoType !== "ISOMETRICO" && (!concentricLoad || !eccentricLoad)) {
        setValidationError("Cargas concêntrica e excêntrica são obrigatórias.");
        return;
      }
    }
    setValidationError(null);

    addMutation.mutate(
      {
        exerciseId: selectedExercise.id,
        orderIndex: currentExerciseCount,
        notes: notes.trim() || null,
        setsExpected: selectedExercise.hasSets && sets ? Number(sets) : null,
        repsExpected: selectedExercise.hasReps && reps ? Number(reps) : null,
        weightExpected: selectedExercise.hasWeight && weight ? Number(weight) : null,
        distanceExpected: selectedExercise.hasDistance && distance ? Number(distance) : null,
        timeExpected: selectedExercise.hasTime && time ? Number(time) : null,
        concentricLoad: isKineo && kineoType !== "ISOMETRICO" && concentricLoad ? Number(concentricLoad) : null,
        eccentricLoad: isKineo && kineoType !== "ISOMETRICO" && eccentricLoad ? Number(eccentricLoad) : null,
        isometricLoad: isKineo && kineoType === "ISOMETRICO" && isometricLoad ? Number(isometricLoad) : null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Exercício</DialogTitle>
          <DialogDescription>
            Selecione um exercício da biblioteca e defina os valores previstos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Exercício *</Label>
            <Select
              value={selectedExercise?.id ?? undefined}
              onValueChange={handleExerciseSelect}
              items={exerciseItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar exercício" />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {exerciseDisplayName(ex.name, ex.modality, ex.kineoType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExercise && (
            <>
              {selectedExercise.hasSets && (
                <div className="space-y-2">
                  <Label htmlFor="add-sets">Séries</Label>
                  <Input
                    id="add-sets"
                    type="number"
                    min={0}
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    placeholder="ex. 3"
                  />
                </div>
              )}

              {selectedExercise.hasReps && (
                <div className="space-y-2">
                  <Label htmlFor="add-reps">Repetições</Label>
                  <Input
                    id="add-reps"
                    type="number"
                    min={0}
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="ex. 10"
                  />
                </div>
              )}

              {selectedExercise.hasWeight && (
                <div className="space-y-2">
                  <Label htmlFor="add-weight">Peso (kg)</Label>
                  <Input
                    id="add-weight"
                    type="number"
                    min={0}
                    step="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="ex. 80"
                  />
                </div>
              )}

              {selectedExercise.hasDistance && (
                <div className="space-y-2">
                  <Label htmlFor="add-distance">Distância (m)</Label>
                  <Input
                    id="add-distance"
                    type="number"
                    min={0}
                    step="0.01"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="ex. 5000"
                  />
                </div>
              )}

              {selectedExercise.hasTime && (
                <div className="space-y-2">
                  <Label htmlFor="add-time">Tempo (s)</Label>
                  <Input
                    id="add-time"
                    type="number"
                    min={0}
                    step="0.01"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="ex. 120"
                  />
                </div>
              )}

              {isKineo && kineoType === "ISOMETRICO" && (
                <div className="space-y-2">
                  <Label htmlFor="add-isometric-load">Carga Isométrica (Kg) *</Label>
                  <Input
                    id="add-isometric-load"
                    type="number"
                    min={0}
                    step="0.01"
                    value={isometricLoad}
                    onChange={(e) => setIsometricLoad(e.target.value)}
                    placeholder="Ex: 50"
                  />
                </div>
              )}

              {isKineo && kineoType && kineoType !== "ISOMETRICO" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-concentric-load">Carga Concêntrica (Kg) *</Label>
                    <Input
                      id="add-concentric-load"
                      type="number"
                      min={0}
                      step="0.01"
                      value={concentricLoad}
                      onChange={(e) => setConcentricLoad(e.target.value)}
                      placeholder="Ex: 40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-eccentric-load">Carga Excêntrica (Kg) *</Label>
                    <Input
                      id="add-eccentric-load"
                      type="number"
                      min={0}
                      step="0.01"
                      value={eccentricLoad}
                      onChange={(e) => setEccentricLoad(e.target.value)}
                      placeholder="Ex: 60"
                    />
                  </div>
                </div>
              )}

              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="add-notes">Notas</Label>
                <Textarea
                  id="add-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas opcionais..."
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={addMutation.isPending || !selectedExercise}
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar Exercício
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
