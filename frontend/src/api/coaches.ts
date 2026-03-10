import { client } from "./client";
import type { Coach } from "../types";

export const getCoaches = () =>
  client.get<Coach[]>("/coaches").then((res) => res.data);

export const createCoach = (data: { name: string }) =>
  client.post<Coach>("/coaches", data).then((res) => res.data);

export const updateCoach = (id: string, data: { name: string }) =>
  client.put<Coach>(`/coaches/${id}`, data).then((res) => res.data);

export const deleteCoach = (id: string) => client.delete(`/coaches/${id}`);
