import { useQuery } from "@tanstack/react-query";
import { getWorkouts } from "@/api/workouts";

export function useCalendarWorkouts(
  startDate: string,
  endDate: string,
  coachId?: string,
  athleteId?: string,
) {
  return useQuery({
    queryKey: ["workouts", { startDate, endDate, coachId, athleteId }],
    queryFn: () => getWorkouts({ startDate, endDate, coachId, athleteId }),
  });
}
