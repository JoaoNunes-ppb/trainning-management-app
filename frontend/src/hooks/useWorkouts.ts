import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getWorkout, createWorkout, updateWorkout, deleteWorkout, patchWorkoutStatus } from "@/api/workouts";

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => getWorkout(id),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Workout created");
    },
    onError: () => {
      toast.error("Failed to create workout");
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateWorkout>[1] & { id: string }) =>
      updateWorkout(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["workout", variables.id] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Workout updated");
    },
    onError: () => {
      toast.error("Failed to update workout");
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Workout deleted");
    },
    onError: () => {
      toast.error("Failed to delete workout");
    },
  });
}

export function useUpdateWorkoutStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patchWorkoutStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["workout", variables.id] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });
}
