import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { upsertResult, deleteResult } from "@/api/exerciseResults";
import type { UpsertResultPayload } from "@/api/exerciseResults";

export function useUpsertResult(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutExerciseId, data }: { workoutExerciseId: string; data: UpsertResultPayload }) =>
      upsertResult(workoutExerciseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Results saved");
    },
    onError: () => {
      toast.error("Failed to save results");
    },
  });
}

export function useDeleteResult(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutExerciseId: string) => deleteResult(workoutExerciseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Results cleared");
    },
    onError: () => {
      toast.error("Failed to clear results");
    },
  });
}
