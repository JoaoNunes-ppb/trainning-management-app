import { useState } from "react";
import { Plus } from "lucide-react";
import type { WorkoutExerciseDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { WorkoutExerciseItem } from "./WorkoutExerciseItem";
import { AddExerciseDialog } from "./AddExerciseDialog";

interface WorkoutExerciseListProps {
  exercises: WorkoutExerciseDetail[];
  workoutId: string;
}

export function WorkoutExerciseList({ exercises, workoutId }: WorkoutExerciseListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Exercícios</h2>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" data-icon="inline-start" />
          Adicionar Exercício
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ainda não existem exercícios. Adicione um para começar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((we) => (
            <WorkoutExerciseItem key={we.id} workoutExercise={we} workoutId={workoutId} />
          ))}
        </div>
      )}

      <AddExerciseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        workoutId={workoutId}
        currentExerciseCount={exercises.length}
      />
    </div>
  );
}
