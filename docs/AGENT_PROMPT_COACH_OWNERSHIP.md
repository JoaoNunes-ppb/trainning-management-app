# Agent Prompt -- Coaches Page + Ownership Restrictions

Copy-paste this prompt into a new Cursor Agent chat.

**Attach:** `@docs/PRD.md` `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@frontend/src`

---

```
You are improving the frontend of an Athlete Management App.

You have full access to run any shell commands (npm, etc.) inside /Users/nunesj/trainning-management-app.

The frontend is fully built in frontend/. The backend is running at http://localhost:8080 with full CRUD APIs for coaches, athletes, exercises, workouts, workout-exercises, and exercise-results.

Read the attached PRD.md (sections 3 and 4), FRONTEND_ARCHITECTURE.md (sections 6 and 7), and API_CONTRACT.md (section 1 -- Coaches).

YOUR TASK has 4 parts. Do them in order.

============================================================
PART 1 -- Coaches Page (/coaches)
============================================================

Create a new page for managing coaches.

STEP 1 -- Add the route:
  Update src/App.tsx: add route /coaches -> CoachesPage

STEP 2 -- Add sidebar link:
  Update src/components/layout/AppLayout.tsx:
  - Add a "Treinadores" link to the sidebar between "Calendário" and "Atletas"
  - Use the Shield icon from lucide-react

STEP 3 -- Create the CoachesPage:
  File: src/pages/CoachesPage.tsx
  - Fetch all coaches using the existing useCoaches() hook
  - Show a table with columns: Nome, Ações
  - "Adicionar Treinador" button opens a dialog with a single "Nome" input field
  - Each row has Edit (pencil icon) and Delete (trash icon) actions
  - Edit opens the same dialog pre-filled
  - Delete shows confirmation: "Tem a certeza que deseja eliminar {name}? Todos os atletas, treinos e resultados deste treinador serão eliminados. Esta ação não pode ser revertida."
  - Use existing API functions: POST /api/coaches, PUT /api/coaches/{id}, DELETE /api/coaches/{id}
  - If these API functions don't exist yet in src/api/coaches.ts, add them:
    - createCoach(data: { name: string })
    - updateCoach(id: string, data: { name: string })
    - deleteCoach(id: string)
  - Add mutation hooks in src/hooks/useCoaches.ts: useCreateCoach, useUpdateCoach, useDeleteCoach
  - On delete success, if the deleted coach was the activeCoach in context, clear the activeCoach (set to null)
  - Toast messages: "Treinador criado", "Treinador atualizado", "Treinador eliminado"
  - All text in Portuguese (pt-PT)

STEP 4 -- Optionally add a "Gerir Treinadores" link at the bottom of the coach selector dropdown in the top bar, navigating to /coaches.

============================================================
PART 2 -- Ownership Helper
============================================================

STEP 5 -- Create the ownership utility:
  File: src/lib/ownership.ts

  export function isOwner(resourceCoachId: string, activeCoachId: string | undefined | null): boolean {
    return !!activeCoachId && resourceCoachId === activeCoachId;
  }

This function is used everywhere to check if the active coach owns a resource.

============================================================
PART 3 -- Calendar View Modes (revised)
============================================================

STEP 6 -- Update CalendarViewMode type:
  In src/types/index.ts, change:
    export type CalendarViewMode = "all" | "byCoach" | "byAthlete";
  To:
    export type CalendarViewMode = "myAthletes" | "all" | "byAthlete";

STEP 7 -- Update CalendarFilterBar:
  File: src/components/calendar/CalendarFilterBar.tsx
  - Replace the three buttons:
    OLD: "All Athletes", "By Coach", "By Athlete"
    NEW: "Os Meus Atletas" (value: "myAthletes"), "Todos os Atletas" (value: "all"), "Por Atleta" (value: "byAthlete")
  - Remove the coach dropdown that appeared for "By Coach" mode (no longer needed)
  - "Os Meus Atletas" has no dropdown -- it automatically uses activeCoach.id
  - "Todos os Atletas" has no dropdown -- fetches all
  - "Por Atleta" shows an athlete dropdown listing ALL athletes (from all coaches). Show the coach name next to each athlete name in the dropdown for clarity, e.g., "Alex Johnson (Coach Mike)"

STEP 8 -- Update WeeklyCalendar (and MonthlyCalendar/DailyCalendar if they exist):
  - Change default viewMode from "byCoach" (or "all") to "myAthletes"
  - When viewMode is "myAthletes": fetch with coachId = activeCoach.id
  - When viewMode is "all": fetch without coachId or athleteId
  - When viewMode is "byAthlete": fetch with athleteId = selectedAthleteId
  - Pass the ownership info to DayColumn and WorkoutCard

STEP 9 -- Update WorkoutCard:
  File: src/components/calendar/WorkoutCard.tsx
  - Accept an optional prop: isOwner (boolean)
  - If isOwner is false, render the card with:
    - Tailwind class "opacity-50 border-dashed" (dimmed look)
    - On hover, show a title/tooltip: "Treino de outro treinador"
  - Card is still clickable (navigates to workout detail in read-only mode)

STEP 10 -- Update DayColumn:
  File: src/components/calendar/DayColumn.tsx
  - Accept a prop: canCreate (boolean)
  - Only show the "+" / click-to-create area if canCreate is true
  - In WeeklyCalendar, compute canCreate:
    - true if viewMode is "myAthletes"
    - true if viewMode is "byAthlete" AND the selected athlete belongs to the active coach
    - false if viewMode is "all"

============================================================
PART 4 -- Workout Detail Read-Only Mode
============================================================

STEP 11 -- Update WorkoutDetailPage:
  File: src/pages/WorkoutDetailPage.tsx
  - After fetching the workout, compute: const owned = isOwner(workout.coachId, activeCoach?.id)
  - Pass "readOnly={!owned}" to WorkoutHeader, WorkoutExerciseList, and all child components

STEP 12 -- Update WorkoutHeader:
  File: src/components/workout/WorkoutHeader.tsx
  - Accept prop: readOnly (boolean)
  - If readOnly is true:
    - Hide the "Editar" and "Eliminar" buttons
    - Show a banner/alert at the top: "Treino de atleta de outro treinador (apenas leitura)" (use a subtle blue/gray info banner with an Info icon from lucide)

STEP 13 -- Update WorkoutExerciseList:
  File: src/components/workout/WorkoutExerciseList.tsx
  - Accept prop: readOnly (boolean)
  - If readOnly is true: hide the "Adicionar Exercício" button
  - Pass readOnly to each WorkoutExerciseItem

STEP 14 -- Update WorkoutExerciseItem:
  File: src/components/workout/WorkoutExerciseItem.tsx
  - Accept prop: readOnly (boolean)
  - If readOnly is true:
    - Hide edit (pencil) and delete (trash) action buttons
    - Do NOT render the ResultLogger component
  - Expected and actual values are still visible (data is shown, just not editable)

STEP 15 -- Update WorkoutForm (create workout):
  File: src/components/workout/WorkoutForm.tsx
  - The athlete dropdown must ONLY show athletes belonging to the active coach
  - Fetch athletes with: getAthletes(activeCoach.id) -- always pass the active coach ID
  - Never show athletes from other coaches in this dropdown

STEP 16 -- Update AthletesPage:
  File: src/pages/AthletesPage.tsx
  - The coachId for creating athletes is ALWAYS the active coach (auto-set, not selectable)
  - If there's any dropdown to choose a different coach for the athlete, remove it
  - The page should only show athletes belonging to the active coach (this should already be the case)

============================================================
VERIFICATION
============================================================

After making all changes, run: cd frontend && npm run dev

Test the following flow:
1. Open http://localhost:5173
2. Go to /coaches -- create a new coach "Coach Test"
3. Select "Coach Mike" from the top bar dropdown
4. Calendar defaults to "Os Meus Atletas" -- only Coach Mike's athletes' workouts appear
5. Switch to "Todos os Atletas" -- all workouts appear. Other coaches' cards are dimmed.
6. Click a dimmed card -- opens workout detail in READ-ONLY mode with the info banner. No edit/delete/add buttons visible.
7. Click a normal card (your athlete) -- opens workout detail with full edit access.
8. Switch to "Por Atleta" -- dropdown shows all athletes with coach name. Select one of yours -- full access. Select another coach's athlete -- read-only.
9. In "Os Meus Atletas" view, click a day -- create workout form opens with only YOUR athletes in the dropdown.
10. In "Todos os Atletas" view, click a day -- nothing happens (no create).
11. Go to /athletes -- only your athletes listed. Add athlete -- auto-assigned to active coach.
12. Switch coach in top bar -- athletes page updates. Calendar updates.

IMPORTANT:
- All text in Portuguese (pt-PT). Use the translation table in section 9 of FRONTEND_ARCHITECTURE.md.
- Do NOT change any backend code. All ownership enforcement is frontend-only.
- Do NOT change files in src/components/ui/.
- Do NOT break existing functionality. Only add/modify the specific behaviors described.
- Run npm run dev and confirm no compilation errors before finishing.
```
