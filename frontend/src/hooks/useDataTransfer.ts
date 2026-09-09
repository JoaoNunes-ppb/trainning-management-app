import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  exportSnapshot,
  importSnapshot,
  validateSnapshot,
} from "@/api/dataTransfer";

export function useExportSnapshot() {
  return useMutation({ mutationFn: exportSnapshot });
}

export function useValidateSnapshot() {
  return useMutation({ mutationFn: validateSnapshot });
}

export function useImportSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importSnapshot,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
