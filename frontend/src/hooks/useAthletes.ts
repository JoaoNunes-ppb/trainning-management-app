import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAthletes,
  createAthlete,
  updateAthlete,
  deleteAthlete,
} from "@/api/athletes";

export function useAthletes(coachId?: string) {
  return useQuery({
    queryKey: ["athletes", { coachId }],
    queryFn: () => getAthletes(coachId),
  });
}

export function useCreateAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAthlete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["athletes"] }),
  });
}

export function useUpdateAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateAthlete>[1] & { id: string }) =>
      updateAthlete(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["athletes"] }),
  });
}

export function useDeleteAthlete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["athletes"] }),
  });
}
