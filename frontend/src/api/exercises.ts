import { client } from "./client";
import type { Exercise } from "../types";

export interface ExercisePayload {
  name: string;
  description?: string | null;
  hasSets: boolean;
  hasReps: boolean;
  hasWeight: boolean;
  hasDistance: boolean;
  hasTime: boolean;
}

export const getExercises = () =>
  client.get<Exercise[]>("/exercises").then((res) => res.data);

export const createExercise = (data: ExercisePayload) =>
  client.post<Exercise>("/exercises", data).then((res) => res.data);

export const updateExercise = (id: string, data: ExercisePayload) =>
  client.put<Exercise>(`/exercises/${id}`, data).then((res) => res.data);

export const deleteExercise = (id: string) => client.delete(`/exercises/${id}`);
