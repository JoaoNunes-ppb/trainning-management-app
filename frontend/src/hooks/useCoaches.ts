import { useQuery } from "@tanstack/react-query";
import { getCoaches } from "@/api/coaches";

export function useCoaches() {
  return useQuery({
    queryKey: ["coaches"],
    queryFn: getCoaches,
  });
}
