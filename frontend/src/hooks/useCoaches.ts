import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoaches, createCoach, updateCoach, deleteCoach } from "@/api/coaches";

export function useCoaches() {
  return useQuery({
    queryKey: ["coaches"],
    queryFn: getCoaches,
  });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCoach,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaches"] }),
  });
}

export function useUpdateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string }) =>
      updateCoach(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaches"] }),
  });
}

export function useDeleteCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCoach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaches"] });
      qc.invalidateQueries({ queryKey: ["athletes"] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}
