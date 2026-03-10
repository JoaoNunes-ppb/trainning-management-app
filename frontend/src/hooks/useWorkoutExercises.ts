import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
} from "@/api/workoutExercises";
import type {
  WorkoutExercisePayload,
  WorkoutExerciseUpdatePayload,
} from "@/api/workoutExercises";

export function useAddExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkoutExercisePayload) => addExercise(workoutId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
      toast.success("Exercise added");
    },
    onError: () => {
      toast.error("Failed to add exercise");
    },
  });
}

export function useUpdateExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: WorkoutExerciseUpdatePayload & { id: string }) =>
      updateExercise(workoutId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
      toast.success("Exercise updated");
    },
    onError: () => {
      toast.error("Failed to update exercise");
    },
  });
}

export function useDeleteExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(workoutId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
      toast.success("Exercise removed");
    },
    onError: () => {
      toast.error("Failed to remove exercise");
    },
  });
}

export function useReorderExercises(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderExercises(workoutId, orderedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout", workoutId] });
    },
    onError: () => {
      toast.error("Failed to reorder exercises");
    },
  });
}
