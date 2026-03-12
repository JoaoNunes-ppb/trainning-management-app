import { client } from "./client";
import type { WorkoutSummary, WorkoutDetail } from "../types";

export const getWorkouts = (params: {
  startDate: string;
  endDate: string;
  coachId?: string;
  athleteId?: string;
}) =>
  client
    .get<WorkoutSummary[]>("/workouts", { params })
    .then((res) => res.data);

export const getWorkout = (id: string) =>
  client.get<WorkoutDetail>(`/workouts/${id}`).then((res) => res.data);

export const createWorkout = (data: {
  athleteId: string;
  label: string;
  date: string;
  notes?: string;
  scheduledTime?: string;
}) =>
  client.post<WorkoutSummary>("/workouts", data).then((res) => res.data);

export const updateWorkout = (
  id: string,
  data: { athleteId: string; label: string; date: string; notes?: string; scheduledTime?: string },
) =>
  client.put<WorkoutSummary>(`/workouts/${id}`, data).then((res) => res.data);

export const deleteWorkout = (id: string) =>
  client.delete(`/workouts/${id}`);

export const patchWorkoutStatus = (id: string, status: string) =>
  client.patch<WorkoutSummary>(`/workouts/${id}/status`, { status }).then((res) => res.data);

export const copyWorkout = (
  sourceWorkoutId: string,
  data: { date: string; scheduledTime?: string | null; label?: string | null },
) =>
  client
    .post<WorkoutDetail>(`/workouts/${sourceWorkoutId}/copy`, data)
    .then((res) => res.data);
