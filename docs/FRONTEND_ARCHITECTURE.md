# Frontend Architecture

## 1. Technology Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| shadcn/ui | Component library (built on Radix UI) |
| TanStack Query (React Query) v5 | Server state management |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| date-fns | Date manipulation |
| Lucide React | Icons |

## 2. Project Structure

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── Dockerfile
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                     (Tailwind directives)
│   ├── api/
│   │   ├── client.ts                 (Axios instance with base URL)
│   │   ├── coaches.ts                (Coach API functions)
│   │   ├── athletes.ts               (Athlete API functions)
│   │   ├── exercises.ts              (Exercise API functions)
│   │   ├── workouts.ts               (Workout API functions)
│   │   ├── workoutExercises.ts       (WorkoutExercise API functions)
│   │   └── exerciseResults.ts        (ExerciseResult API functions)
│   ├── types/
│   │   └── index.ts                  (TypeScript interfaces matching API contract)
│   ├── context/
│   │   └── CoachContext.tsx           (Active coach state)
│   ├── hooks/
│   │   ├── useCoaches.ts
│   │   ├── useAthletes.ts
│   │   ├── useExercises.ts
│   │   ├── useWorkouts.ts
│   │   └── useCalendar.ts
│   ├── pages/
│   │   ├── CalendarPage.tsx
│   │   ├── AthletesPage.tsx
│   │   ├── ExercisesPage.tsx
│   │   └── WorkoutDetailPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx          (Shell with sidebar/topbar)
│   │   │   ├── TopBar.tsx             (Coach selector + navigation)
│   │   │   └── Sidebar.tsx            (Nav links)
│   │   ├── calendar/
│   │   │   ├── WeeklyCalendar.tsx     (Main calendar grid)
│   │   │   ├── CalendarHeader.tsx     (Week nav arrows + "Today" button)
│   │   │   ├── CalendarFilterBar.tsx  (View mode switch + dropdowns)
│   │   │   ├── DayColumn.tsx          (Single day column)
│   │   │   └── WorkoutCard.tsx        (Compact card in calendar cell)
│   │   ├── athlete/
│   │   │   ├── AthleteList.tsx
│   │   │   └── AthleteForm.tsx        (Create/edit dialog)
│   │   ├── exercise/
│   │   │   ├── ExerciseList.tsx
│   │   │   ├── ExerciseForm.tsx       (Create/edit with parameter toggles)
│   │   │   └── ParameterToggles.tsx   (Checkbox group for sets/reps/weight/distance/time)
│   │   ├── workout/
│   │   │   ├── WorkoutHeader.tsx      (Label, date, athlete, notes)
│   │   │   ├── WorkoutExerciseList.tsx (Ordered list, drag-to-reorder)
│   │   │   ├── WorkoutExerciseItem.tsx (Single exercise row with expected values)
│   │   │   ├── AddExerciseDialog.tsx   (Pick from library + set expected values)
│   │   │   └── WorkoutForm.tsx         (Create/edit workout metadata)
│   │   └── result/
│   │       └── ResultLogger.tsx        (Inline form for actual values)
│   └── lib/
│       ├── utils.ts                   (shadcn cn() helper, etc.)
│       └── dateUtils.ts              (Week start/end calculations)
```

## 3. Routing

```typescript
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/" element={<CalendarPage />} />
    <Route path="/athletes" element={<AthletesPage />} />
    <Route path="/exercises" element={<ExercisesPage />} />
    <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
  </Route>
</Routes>
```

All routes render inside `AppLayout`, which provides the top bar (with coach selector) and sidebar navigation.

## 4. TypeScript Types

Interfaces mirror the API contract responses:

```typescript
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

export type CalendarViewMode = "all" | "byCoach" | "byAthlete";
```

## 5. State Management

### 5.1 Server State (TanStack Query)

All API data is fetched and cached using TanStack Query. This provides automatic refetching, caching, and loading/error states.

**Query keys convention:**
- `["coaches"]` -- all coaches
- `["athletes", { coachId }]` -- athletes filtered by coach (or all)
- `["exercises"]` -- all exercises
- `["workouts", { startDate, endDate, coachId?, athleteId? }]` -- calendar data
- `["workout", workoutId]` -- single workout detail

**Mutations** invalidate relevant queries on success:
- Creating/updating/deleting an athlete invalidates `["athletes"]`
- Creating/updating/deleting a workout invalidates `["workouts"]` and `["workout", id]`
- Logging a result invalidates `["workout", workoutId]`

### 5.2 Client State (React Context)

A single `CoachContext` provides:

```typescript
interface CoachContextValue {
  activeCoach: Coach | null;
  setActiveCoach: (coach: Coach) => void;
}
```

The active coach is persisted to `localStorage` so it survives page refreshes. On first load, if no coach is saved, the app prompts the user to select one.

## 6. Key Component Behaviors

### 6.1 WeeklyCalendar

- Receives the current week's start date (always a Monday) as state.
- Fetches workouts for the 7-day range via `GET /api/workouts?startDate=...&endDate=...&coachId=...&athleteId=...`.
- Groups workouts by date on the client side.
- Renders 7 `DayColumn` components, each showing a list of `WorkoutCard` items.
- The filter bar allows switching between "All", "By Coach", and "By Athlete" modes.

### 6.2 CalendarFilterBar

- Three tabs/buttons: "All Athletes", "By Coach", "By Athlete".
- "By Coach" reveals a coach dropdown (defaults to active coach from context).
- "By Athlete" reveals an athlete dropdown (optionally pre-filtered by active coach).
- Changing the filter triggers a new query for workouts.

### 6.3 WorkoutCard

- Displays: workout label, athlete name, exercise count badge.
- Shows a small indicator if results have been logged (e.g., checkmark icon).
- Clicking navigates to `/workouts/:id`.

### 6.4 WorkoutDetailPage

- Fetches full workout detail via `GET /api/workouts/:id`.
- Shows workout header (label, date, athlete, notes) with edit capability.
- Lists exercises in order, each showing:
  - Exercise name
  - Expected values (only the enabled parameter fields)
  - Result logger (inline, showing actual fields matching the exercise's parameter flags)
- "Add Exercise" button opens a dialog to pick from the exercise library and set expected values.
- Drag-to-reorder exercises (calls PUT /api/workouts/{id}/exercises/reorder).

### 6.5 ExerciseForm

- Name and description fields.
- `ParameterToggles` component: 5 checkboxes for sets, reps, weight, distance, time.
- At least one parameter must be toggled on (validation).

### 6.6 ResultLogger

- An inline expandable form per exercise in the workout detail page.
- Only shows input fields for the parameters enabled on the exercise template.
- "Save" calls `PUT /api/workout-exercises/{id}/result`.
- "Clear" calls `DELETE /api/workout-exercises/{id}/result`.
- Visual indicator (green checkmark or highlight) when results are logged.

## 7. API Layer

Each API module exports functions that return typed promises:

```typescript
// api/workouts.ts
import { client } from "./client";
import { WorkoutSummary, WorkoutDetail, CreateWorkoutRequest } from "../types";

export const getWorkouts = (params: {
  startDate: string;
  endDate: string;
  coachId?: string;
  athleteId?: string;
}) => client.get<WorkoutSummary[]>("/workouts", { params });

export const getWorkout = (id: string) =>
  client.get<WorkoutDetail>(`/workouts/${id}`);

export const createWorkout = (data: CreateWorkoutRequest) =>
  client.post<WorkoutSummary>("/workouts", data);

export const updateWorkout = (id: string, data: CreateWorkoutRequest) =>
  client.put<WorkoutSummary>(`/workouts/${id}`, data);

export const deleteWorkout = (id: string) =>
  client.delete(`/workouts/${id}`);
```

The Axios client is configured with the base URL:

```typescript
// api/client.ts
import axios from "axios";

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});
```

## 8. UI Language -- Portuguese (pt-PT)

All user-facing text in the frontend MUST be written in **Portuguese (Portugal)**. The API endpoints, JSON field names, TypeScript types, variable names, and code remain in English. Only the visible UI text (labels, headings, buttons, placeholders, messages, tooltips) is in Portuguese.

### Translation Reference

| English | Portuguese |
|---------|-----------|
| Athlete Manager | Gestão de Atletas |
| Calendar | Calendário |
| Athletes | Atletas |
| Exercises | Exercícios |
| Workouts | Treinos |
| Coach | Treinador |
| Select a coach | Selecionar treinador |
| Name | Nome |
| Date of Birth | Data de Nascimento |
| Notes | Notas |
| Description | Descrição |
| Add Athlete | Adicionar Atleta |
| Edit Athlete | Editar Atleta |
| Delete Athlete | Eliminar Atleta |
| Add Exercise | Adicionar Exercício |
| Edit Exercise | Editar Exercício |
| Delete Exercise | Eliminar Exercício |
| Add Workout | Adicionar Treino |
| Edit Workout | Editar Treino |
| Delete Workout | Eliminar Treino |
| New Workout | Novo Treino |
| Workout Detail | Detalhe do Treino |
| Add Exercise to Workout | Adicionar Exercício ao Treino |
| Exercise Library | Biblioteca de Exercícios |
| Sets | Séries |
| Reps | Repetições |
| Weight (kg) | Peso (kg) |
| Distance (m) | Distância (m) |
| Time (s) | Tempo (s) |
| Expected | Previsto |
| Actual | Realizado |
| Log Results | Registar Resultados |
| Edit Results | Editar Resultados |
| Clear Results | Limpar Resultados |
| Results saved | Resultados guardados |
| Results cleared | Resultados limpos |
| Save | Guardar |
| Cancel | Cancelar |
| Delete | Eliminar |
| Edit | Editar |
| Confirm | Confirmar |
| Back to Calendar | Voltar ao Calendário |
| Today | Hoje |
| All Athletes | Todos os Atletas |
| By Coach | Por Treinador |
| By Athlete | Por Atleta |
| No athletes yet | Ainda não existem atletas |
| No exercises yet | Ainda não existem exercícios |
| No workouts yet | Ainda não existem treinos |
| Please select a coach first | Por favor selecione um treinador primeiro |
| Are you sure? | Tem a certeza? |
| This action cannot be undone | Esta ação não pode ser revertida |
| Created successfully | Criado com sucesso |
| Updated successfully | Atualizado com sucesso |
| Deleted successfully | Eliminado com sucesso |
| Cannot delete exercise in use | Não é possível eliminar exercício em uso |
| Label | Título |
| Date | Data |
| Actions | Ações |
| exercises | exercícios |
| Parameters | Parâmetros |
| At least one parameter required | Pelo menos um parâmetro é obrigatório |

### Day Names (Calendar Headers)

| English | Portuguese |
|---------|-----------|
| Mon | Seg |
| Tue | Ter |
| Wed | Qua |
| Thu | Qui |
| Fri | Sex |
| Sat | Sáb |
| Sun | Dom |

Use the `pt-PT` locale from date-fns when formatting dates:

```typescript
import { pt } from "date-fns/locale";
format(date, "d 'de' MMMM", { locale: pt });
```

## 9. UI/UX Guidelines

- **Clean, minimal design** using Tailwind's neutral color palette.
- **shadcn/ui components** for buttons, inputs, selects, dialogs, cards, tables, toasts.
- **Responsive layout**: Sidebar collapses on small screens. Calendar scrolls horizontally if needed.
- **Loading states**: Skeleton loaders for calendar and lists (via TanStack Query's `isLoading`).
- **Error states**: Toast notifications for failed operations.
- **Empty states**: Helpful messages when there are no athletes, exercises, or workouts.
- **Confirmation dialogs** for destructive actions (delete).
- **All UI text in Portuguese (pt-PT)** -- see section 8 for the translation reference.

## 9. Implementation Order

Build the frontend in this order:

1. **Project scaffold**: Vite + React + TypeScript + Tailwind + shadcn/ui setup
2. **Types and API layer**: TypeScript interfaces, Axios client, all API modules
3. **Layout**: `AppLayout`, `TopBar`, `Sidebar`, routing
4. **CoachContext**: Active coach state + selector dropdown
5. **Coaches page** (optional, could be minimal -- just the dropdown in TopBar)
6. **Athletes page**: List + create/edit/delete
7. **Exercises page**: List + create/edit/delete with parameter toggles
8. **Calendar page**: `WeeklyCalendar`, `CalendarHeader`, `CalendarFilterBar`, `DayColumn`, `WorkoutCard`
9. **Workout detail page**: Header, exercise list, add exercise dialog, reorder
10. **Result logging**: `ResultLogger` inline forms
