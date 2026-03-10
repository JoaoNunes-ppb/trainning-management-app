export interface Coach {
  id: string;
  name: string;
}

export interface Athlete {
  id: string;
  name: string;
  dateOfBirth: string | null;
  coachId: string;
  coachName: string;
  notes: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  hasSets: boolean;
  hasReps: boolean;
  hasWeight: boolean;
  hasDistance: boolean;
  hasTime: boolean;
}

export interface WorkoutSummary {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  coachName: string;
  label: string;
  date: string;
  notes: string | null;
  exerciseCount: number;
  hasResults: boolean;
  status: WorkoutStatus;
  scheduledTime: string | null;
}

export interface WorkoutDetail {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  coachName: string;
  label: string;
  date: string;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
  status: WorkoutStatus;
  scheduledTime: string | null;
}

export interface WorkoutExerciseDetail {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  notes: string | null;
  setsExpected: number | null;
  repsExpected: number | null;
  weightExpected: number | null;
  distanceExpected: number | null;
  timeExpected: number | null;
  exercise: Exercise;
  result: ExerciseResult | null;
}

export interface ExerciseResult {
  id: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  distance: number | null;
  time: number | null;
  notes: string | null;
}

export type WorkoutStatus = "PENDING" | "COMPLETED" | "MISSED";

export type CalendarViewMode = "all" | "byCoach" | "byAthlete";

export type CalendarTimeScale = "day" | "week" | "month";

export interface AthleteProgressResponse {
  athlete: Athlete;
  stats: ProgressStats;
  workouts: WorkoutProgressItem[];
}

export interface ProgressStats {
  totalWorkouts: number;
  completedCount: number;
  missedCount: number;
  pendingCount: number;
  completionRate: number;
}

export interface WorkoutProgressItem {
  id: string;
  label: string;
  date: string;
  scheduledTime: string | null;
  status: WorkoutStatus;
  notes: string | null;
  exercises: ExerciseProgressItem[];
}

export interface ExerciseProgressItem {
  exerciseId: string;
  exerciseName: string;
  setsExpected: number | null;
  repsExpected: number | null;
  weightExpected: number | null;
  distanceExpected: number | null;
  timeExpected: number | null;
  setsActual: number | null;
  repsActual: number | null;
  weightActual: number | null;
  distanceActual: number | null;
  timeActual: number | null;
  hasResult: boolean;
}
