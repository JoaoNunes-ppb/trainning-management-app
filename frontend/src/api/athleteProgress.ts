import { client } from "./client";
import type { AthleteProgressResponse } from "../types";

export const getAthleteProgress = (
  athleteId: string,
  startDate?: string,
  endDate?: string,
) =>
  client
    .get<AthleteProgressResponse>(`/athletes/${athleteId}/progress`, {
      params: { startDate, endDate },
    })
    .then((res) => res.data);
