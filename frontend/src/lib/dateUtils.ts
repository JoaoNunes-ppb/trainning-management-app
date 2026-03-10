import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import { pt } from "date-fns/locale";

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function formatDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "MMM d, yyyy", { locale: pt });
}

export function getMonthStart(date: Date): Date {
  return startOfMonth(date);
}

export function getMonthEnd(date: Date): Date {
  return endOfMonth(date);
}

export function getDayStart(date: Date): Date {
  return startOfDay(date);
}

export function getDayEnd(date: Date): Date {
  return endOfDay(date);
}
