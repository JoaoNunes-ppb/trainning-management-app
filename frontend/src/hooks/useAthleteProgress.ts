import { useQuery } from "@tanstack/react-query";
import { getAthleteProgress } from "@/api/athleteProgress";

export function useAthleteProgress(
  athleteId: string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["athleteProgress", athleteId, { startDate, endDate }],
    queryFn: () => getAthleteProgress(athleteId, startDate, endDate),
    enabled: !!athleteId,
  });
}
