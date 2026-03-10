import { client } from "./client";
import type { Coach } from "../types";

export const getCoaches = () =>
  client.get<Coach[]>("/coaches").then((res) => res.data);
