import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useWorkout } from "@/hooks/useWorkouts";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { WorkoutExerciseList } from "@/components/workout/WorkoutExerciseList";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

const statusBorderColor: Record<string, string> = {
  COMPLETED: "border-t-green-500",
  MISSED: "border-t-red-500",
  PENDING: "border-t-primary",
};

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading, isError } = useWorkout(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !workout) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-lg font-medium">Treino não encontrado</p>
        <p className="text-sm text-muted-foreground">
          O treino que procura não existe ou foi eliminado.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card className={`border-t-4 ${statusBorderColor[workout.status] ?? "border-t-primary"}`}>
        <CardContent className="space-y-6 p-6">
          <WorkoutHeader workout={workout} />
          <Separator />
          <WorkoutExerciseList exercises={workout.exercises} workoutId={workout.id} />
        </CardContent>
      </Card>
    </div>
  );
}
