import { client } from "./client";
import type { WorkoutExerciseDetail } from "../types";

export interface WorkoutExercisePayload {
  exerciseId: string;
  orderIndex: number;
  notes?: string | null;
  setsExpected?: number | null;
  repsExpected?: number | null;
  weightExpected?: number | null;
  distanceExpected?: number | null;
  timeExpected?: number | null;
}

export interface WorkoutExerciseUpdatePayload {
  orderIndex?: number;
  notes?: string | null;
  setsExpected?: number | null;
  repsExpected?: number | null;
  weightExpected?: number | null;
  distanceExpected?: number | null;
  timeExpected?: number | null;
}

export const addExercise = (workoutId: string, data: WorkoutExercisePayload) =>
  client
    .post<WorkoutExerciseDetail>(`/workouts/${workoutId}/exercises`, data)
    .then((res) => res.data);

export const updateExercise = (
  workoutId: string,
  id: string,
  data: WorkoutExerciseUpdatePayload,
) =>
  client
    .put<WorkoutExerciseDetail>(`/workouts/${workoutId}/exercises/${id}`, data)
    .then((res) => res.data);

export const deleteExercise = (workoutId: string, id: string) =>
  client.delete(`/workouts/${workoutId}/exercises/${id}`);

export const reorderExercises = (workoutId: string, orderedIds: string[]) =>
  client
    .put(`/workouts/${workoutId}/exercises/reorder`, { orderedIds })
    .then((res) => res.data);
