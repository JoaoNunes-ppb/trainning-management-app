import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "@/api/exercises";
import type { ExercisePayload } from "@/api/exercises";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: getExercises,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: ExercisePayload & { id: string }) => updateExercise(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
    onError: (error: AxiosError<{ message?: string }>) => {
      if (error.response?.status === 409) {
        toast.error(
          error.response.data?.message ??
            "Cannot delete exercise that is used in workouts",
        );
      }
    },
  });
}
