import { client } from "./client";
import type { ExerciseResult } from "../types";

export interface UpsertResultPayload {
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  distance?: number | null;
  time?: number | null;
  notes?: string | null;
}

export const upsertResult = (workoutExerciseId: string, data: UpsertResultPayload) =>
  client
    .put<ExerciseResult>(`/workout-exercises/${workoutExerciseId}/result`, data)
    .then((res) => res.data);

export const deleteResult = (workoutExerciseId: string) =>
  client.delete(`/workout-exercises/${workoutExerciseId}/result`);
