import { client } from "./client";
import type { Athlete } from "../types";

export const getAthletes = (coachId?: string) =>
  client
    .get<Athlete[]>("/athletes", { params: coachId ? { coachId } : undefined })
    .then((res) => res.data);

export const createAthlete = (data: {
  name: string;
  dateOfBirth?: string | null;
  coachId: string;
  notes?: string | null;
}) => client.post<Athlete>("/athletes", data).then((res) => res.data);

export const updateAthlete = (
  id: string,
  data: {
    name: string;
    dateOfBirth?: string | null;
    coachId: string;
    notes?: string | null;
  },
) => client.put<Athlete>(`/athletes/${id}`, data).then((res) => res.data);

export const deleteAthlete = (id: string) => client.delete(`/athletes/${id}`);
