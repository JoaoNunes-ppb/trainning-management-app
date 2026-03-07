# Agent Guide V2 -- Feature Enhancements

How to add new features to the Athlete Management App using AI coding agents.

**Prerequisites:** The full app from AGENT_GUIDE.md (Agents 1-15) must already be built and working.

## How to Use

1. Create a **new chat** for each agent below.
2. Copy-paste the prompt into the chat.
3. Use `@` to attach the doc/source files listed in the "Attach" section of each agent.
4. Let the agent run. It has full permission to create/modify files, run shell commands, and build the project.
5. After the agent finishes, check the "Done When" criteria before moving to the next agent.
6. Follow the order strictly. Each agent depends on the previous ones.

## Agent Sequence

| #  | Agent Name | Done When |
|----|-----------|-----------|
| 16 | Backend: Workout Status & Scheduled Time | `mvn clean install` passes, `PATCH /api/workouts/{id}/status` returns updated workout, `POST /api/workouts` accepts `scheduledTime` |
| 17 | Backend: Athlete Progress API | `mvn clean install` passes, `GET /api/athletes/{id}/progress` returns workouts with exercises, results, and stats |
| 18 | Frontend: Workout Status & Time | Workout form has time picker, workout cards show status color + time, status can be toggled on detail page |
| 19 | Frontend: Athlete Progress Page | Clicking an athlete name navigates to `/athletes/{id}`, page shows stats cards + workout history table |
| 20 | Frontend: Month & Day Calendar Views | View switcher (Day/Week/Month) works, month view shows workout dots, day view shows time-slot grid |
| 21 | Frontend: Styling Improvements | App has brand color, improved cards/tables/layout, mobile sidebar hamburger, dark mode polished |

---

## Agent 16 -- Backend: Workout Status & Scheduled Time

**Attach:** `@backend/src/main/kotlin/com/athletemanager/workout/Workout.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutDto.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutService.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutController.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutRepository.kt`

```
You are adding features to the backend of an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has full CRUD for Coach, Athlete, Exercise, Workout, WorkoutExercise, and ExerciseResult. Read the attached source files to understand the current code.

YOUR TASK: Add workout status (PENDING / COMPLETED / MISSED) and scheduled time to the Workout entity, with a new PATCH endpoint to update status.

STEP 1 -- Create the Flyway migration:
  File: backend/src/main/resources/db/migration/V4__add_workout_status_and_time.sql

  Contents:
    ALTER TABLE workout ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
    ALTER TABLE workout ADD COLUMN scheduled_time TIME;

STEP 2 -- Update the Workout entity:
  File: backend/src/main/kotlin/com/athletemanager/workout/Workout.kt

  Add two new fields:
    @Column(nullable = false)
    var status: String = "PENDING"

    @Column(name = "scheduled_time")
    var scheduledTime: java.time.LocalTime? = null

STEP 3 -- Update the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutDto.kt

  a) Add to CreateWorkoutRequest:
    val scheduledTime: java.time.LocalTime? = null

  b) Add to WorkoutSummaryResponse:
    val status: String
    val scheduledTime: java.time.LocalTime?

  c) Update the toSummaryResponse() extension function to include status and scheduledTime from the entity.

  d) Add to WorkoutDetailResponse:
    val status: String
    val scheduledTime: java.time.LocalTime?

  e) Create a new DTO:
    data class UpdateWorkoutStatusRequest(
        @field:NotBlank val status: String
    )

STEP 4 -- Update WorkoutService:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutService.kt

  a) In the create() method, set workout.scheduledTime = request.scheduledTime

  b) In the update() method, set workout.scheduledTime = request.scheduledTime

  c) In the findDetailById() method, include status and scheduledTime in the WorkoutDetailResponse construction.

  d) Add a new method:
    fun updateStatus(id: UUID, request: UpdateWorkoutStatusRequest): WorkoutSummaryResponse {
        val allowedStatuses = setOf("PENDING", "COMPLETED", "MISSED")
        if (request.status !in allowedStatuses) {
            throw BusinessRuleException("Status must be one of: PENDING, COMPLETED, MISSED")
        }
        val workout = workoutRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout not found with id: $id") }
        workout.status = request.status
        val saved = workoutRepository.save(workout)
        val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(saved.id!!)
        val hasResults = exercises.any { exerciseResultRepository.findByWorkoutExerciseId(it.id!!) != null }
        return saved.toSummaryResponse(exerciseCount = exercises.size, hasResults = hasResults)
    }

  Make sure to import BusinessRuleException.

STEP 5 -- Update WorkoutController:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutController.kt

  Add a new endpoint:
    @PatchMapping("/{id}/status")
    fun updateStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateWorkoutStatusRequest
    ): ResponseEntity<WorkoutSummaryResponse> =
        ResponseEntity.ok(workoutService.updateStatus(id, request))

STEP 6 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local
  Test with curl:

  # Create a workout with scheduled time
  curl -s -X POST http://localhost:8080/api/workouts \
    -H "Content-Type: application/json" \
    -d '{"athleteId":"<USE_A_REAL_ATHLETE_ID_FROM_SEED_DATA>","label":"Morning Run","date":"2026-03-10","scheduledTime":"08:30:00"}'
  (Should return 201 with status "PENDING" and scheduledTime "08:30:00")

  # Mark as completed
  curl -s -X PATCH http://localhost:8080/api/workouts/<WORKOUT_ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"COMPLETED"}'
  (Should return 200 with status "COMPLETED")

  # Test invalid status
  curl -s -X PATCH http://localhost:8080/api/workouts/<WORKOUT_ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"INVALID"}'
  (Should return 409)

  # Verify GET returns new fields
  curl -s "http://localhost:8080/api/workouts?startDate=2026-03-09&endDate=2026-03-11" | head
  (Should include status and scheduledTime fields)

  Stop the app after verifying.

IMPORTANT:
- You ARE modifying existing files in this agent. Be careful to only add code, not remove or break existing functionality.
- The status field is a String, not an enum -- validation happens in the service layer.
- scheduledTime is nullable (not all workouts have a scheduled time).
- The existing PUT /api/workouts/{id} endpoint should NOT change the status -- only the PATCH endpoint changes status.
- Run mvn clean install and make sure it passes before finishing.
```

---

## Agent 17 -- Backend: Athlete Progress API

**Attach:** `@backend/src/main/kotlin/com/athletemanager/athlete/AthleteController.kt` `@backend/src/main/kotlin/com/athletemanager/athlete/AthleteService.kt` `@backend/src/main/kotlin/com/athletemanager/athlete/AthleteDto.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutService.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutDto.kt` `@backend/src/main/kotlin/com/athletemanager/workout/WorkoutRepository.kt`

```
You are adding features to the backend of an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has full CRUD for all entities. Agent 16 has already added status and scheduledTime fields to Workout. Read the attached source files to understand the current code.

YOUR TASK: Add an athlete progress endpoint that returns all workouts for an athlete with exercises, results, and summary statistics.

STEP 1 -- Create progress DTOs:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteProgressDto.kt

  data class AthleteProgressResponse(
      val athlete: AthleteResponse,
      val stats: ProgressStats,
      val workouts: List<WorkoutProgressItem>
  )

  data class ProgressStats(
      val totalWorkouts: Int,
      val completedCount: Int,
      val missedCount: Int,
      val pendingCount: Int,
      val completionRate: Double   // percentage 0.0 - 100.0
  )

  data class WorkoutProgressItem(
      val id: UUID,
      val label: String,
      val date: LocalDate,
      val scheduledTime: LocalTime?,
      val status: String,
      val notes: String?,
      val exercises: List<ExerciseProgressItem>
  )

  data class ExerciseProgressItem(
      val exerciseId: UUID,
      val exerciseName: String,
      val setsExpected: Int?,
      val repsExpected: Int?,
      val weightExpected: BigDecimal?,
      val distanceExpected: BigDecimal?,
      val timeExpected: Int?,
      val setsActual: Int?,
      val repsActual: Int?,
      val weightActual: BigDecimal?,
      val distanceActual: BigDecimal?,
      val timeActual: Int?,
      val hasResult: Boolean
  )

STEP 2 -- Create progress service:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteProgressService.kt

  @Service class injecting AthleteRepository, AthleteService, WorkoutRepository, WorkoutExerciseRepository, ExerciseResultRepository.

  Method: getProgress(athleteId: UUID, startDate: LocalDate?, endDate: LocalDate?): AthleteProgressResponse

  Logic:
    1. Get the athlete via AthleteService.findById(athleteId) -- this gives AthleteResponse and handles 404.
    2. Get workouts:
       - If startDate and endDate are provided, use workoutRepository.findByAthleteIdAndDateBetween(athleteId, startDate, endDate)
       - Else, use a new repository method: workoutRepository.findByAthleteIdOrderByDateDesc(athleteId)
    3. For each workout, get its workout exercises and their results.
    4. Build WorkoutProgressItem list (sorted by date descending).
    5. Compute ProgressStats from the workout statuses.
    6. Return AthleteProgressResponse.

  Add the new repository method to WorkoutRepository:
    fun findByAthleteIdOrderByDateDesc(athleteId: UUID): List<Workout>

STEP 3 -- Add endpoint to AthleteController:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteController.kt

  Add a new endpoint:
    @GetMapping("/{id}/progress")
    fun getProgress(
        @PathVariable id: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?
    ): ResponseEntity<AthleteProgressResponse> =
        ResponseEntity.ok(athleteProgressService.getProgress(id, startDate, endDate))

  Inject AthleteProgressService into the controller.

STEP 4 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local
  Test with curl:

  # Get progress for a seed athlete (use a real UUID from seed data)
  curl -s http://localhost:8080/api/athletes/<ATHLETE_ID>/progress | python3 -m json.tool | head -40
  (Should return athlete info, stats with totalWorkouts/completedCount/etc., and workouts array)

  # Test with date range
  curl -s "http://localhost:8080/api/athletes/<ATHLETE_ID>/progress?startDate=2026-01-01&endDate=2026-12-31" | python3 -m json.tool | head -20

  # Test with non-existent athlete
  curl -s http://localhost:8080/api/athletes/00000000-0000-0000-0000-000000000099/progress
  (Should return 404)

  Stop the app after verifying.

IMPORTANT:
- You ARE modifying AthleteController.kt (adding one new endpoint and injecting the new service).
- You ARE modifying WorkoutRepository.kt (adding one new method).
- Do NOT modify any other existing files. Create new files for DTOs and the service.
- The completionRate should be calculated as: (completedCount / totalWorkouts) * 100, or 0.0 if totalWorkouts is 0.
- Workouts should be sorted by date descending (most recent first).
- Run mvn clean install and make sure it passes before finishing.
```

---

## Agent 18 -- Frontend: Workout Status & Time

**Attach:** `@frontend/src/types/index.ts` `@frontend/src/api/workouts.ts` `@frontend/src/hooks/useWorkouts.ts` `@frontend/src/components/workout/WorkoutForm.tsx` `@frontend/src/components/workout/WorkoutHeader.tsx` `@frontend/src/components/calendar/WorkoutCard.tsx`

```
You are adding features to the frontend of an Athlete Management App.

You have full access to run any shell commands (npm, etc.) inside the project at /Users/nunesj/trainning-management-app.

The frontend/ is a React + TypeScript app using Vite, TanStack React Query, shadcn/ui, and Tailwind CSS v4. Read the attached source files to understand the current code.

The backend now has:
- Workout entity with status ("PENDING" | "COMPLETED" | "MISSED") and scheduledTime (HH:mm:ss, nullable)
- PATCH /api/workouts/{id}/status with body { "status": "COMPLETED" }
- CreateWorkoutRequest now accepts scheduledTime
- WorkoutSummaryResponse and WorkoutDetailResponse now include status and scheduledTime fields

YOUR TASK: Update the frontend to support workout status and scheduled time.

STEP 1 -- Update TypeScript types:
  File: frontend/src/types/index.ts

  a) Add a new type:
    export type WorkoutStatus = "PENDING" | "COMPLETED" | "MISSED";

  b) Add to WorkoutSummary interface:
    status: WorkoutStatus;
    scheduledTime: string | null;

  c) Add to WorkoutDetail interface:
    status: WorkoutStatus;
    scheduledTime: string | null;

STEP 2 -- Update API service:
  File: frontend/src/api/workouts.ts

  a) Add scheduledTime to the createWorkout and updateWorkout data parameter types:
    scheduledTime?: string;

  b) Add a new function:
    export const patchWorkoutStatus = (id: string, status: string) =>
      client.patch<WorkoutSummary>(`/workouts/${id}/status`, { status }).then(res => res.data);

STEP 3 -- Update hooks:
  File: frontend/src/hooks/useWorkouts.ts

  Add a new hook:
    export function useUpdateWorkoutStatus() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
          patchWorkoutStatus(id, status),
        onSuccess: (_data, variables) => {
          qc.invalidateQueries({ queryKey: ["workout", variables.id] });
          qc.invalidateQueries({ queryKey: ["workouts"] });
          toast.success("Status updated");
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      });
    }

  Import patchWorkoutStatus from the API module.

STEP 4 -- Update WorkoutForm:
  File: frontend/src/components/workout/WorkoutForm.tsx

  Add a time input field after the date field:
    - Add state: const [scheduledTime, setScheduledTime] = useState("");
    - Reset it in the useEffect when dialog opens.
    - Add a form field with Label "Time" and Input type="time".
    - Include scheduledTime in the mutation payload (send as "HH:mm:00" if set, or undefined if empty).

STEP 5 -- Update WorkoutCard:
  File: frontend/src/components/calendar/WorkoutCard.tsx

  a) Replace the existing green CheckCircle indicator with a status-aware indicator:
    - COMPLETED: green circle icon (CheckCircle2 or similar)
    - MISSED: red circle icon (XCircle)
    - PENDING: no icon (or a subtle gray clock icon if scheduledTime exists)

  b) If scheduledTime is set, show the time (HH:mm format) as a small label on the card, e.g. below the athlete name.

  c) Use these color mappings:
    - COMPLETED: text-green-500 (or a green border-left accent)
    - MISSED: text-red-500 (or a red border-left accent)
    - PENDING: default styling

STEP 6 -- Update WorkoutHeader:
  File: frontend/src/components/workout/WorkoutHeader.tsx

  a) Show the current status as a colored badge next to the workout label:
    - PENDING: secondary/outline badge
    - COMPLETED: green badge (use className for bg-green-100 text-green-800 or similar)
    - MISSED: red badge (bg-red-100 text-red-800)

  b) Add a status dropdown/select (or 3 buttons) that calls useUpdateWorkoutStatus to change the status.
     Place it in the header area, near the edit/delete buttons.

  c) Show scheduledTime if present, next to the date display, formatted as "at HH:mm".

  d) In the Edit dialog, add the scheduledTime field (same as in WorkoutForm) and include it in the update payload.

STEP 7 -- Verify:
  Make sure the frontend compiles with no TypeScript errors:
  Run: cd frontend && npx tsc --noEmit

  Then start both backend and frontend and verify:
  - Creating a workout with a time works
  - The calendar shows status colors and time on workout cards
  - The workout detail page shows the status badge and lets you toggle status
  - Changing status updates the card on the calendar

IMPORTANT:
- You ARE modifying existing files. Be careful to preserve all existing functionality.
- Use lucide-react icons (CheckCircle2, XCircle, Clock, etc.) -- they are already a dependency.
- Use shadcn Badge component for the status badge in WorkoutHeader (already in ui/badge.tsx).
- The time format from the backend is "HH:mm:ss" -- display as "HH:mm" (strip the seconds).
- Make sure all imports are correct and no unused imports remain.
- Run npx tsc --noEmit to verify no type errors.
```

---

## Agent 19 -- Frontend: Athlete Progress Page

**Attach:** `@frontend/src/App.tsx` `@frontend/src/types/index.ts` `@frontend/src/pages/AthletesPage.tsx` `@frontend/src/api/workouts.ts` `@frontend/src/hooks/useWorkouts.ts`

```
You are adding features to the frontend of an Athlete Management App.

You have full access to run any shell commands (npm, etc.) inside the project at /Users/nunesj/trainning-management-app.

The frontend/ is a React + TypeScript app using Vite, TanStack React Query, shadcn/ui, and Tailwind CSS v4. Read the attached source files to understand the current code.

The backend now has:
- GET /api/athletes/{id}/progress?startDate=&endDate=
  Returns JSON:
  {
    "athlete": { "id": "...", "name": "...", "dateOfBirth": "...", "coachId": "...", "coachName": "...", "notes": "..." },
    "stats": { "totalWorkouts": 5, "completedCount": 3, "missedCount": 1, "pendingCount": 1, "completionRate": 60.0 },
    "workouts": [
      {
        "id": "...", "label": "...", "date": "2026-03-01", "scheduledTime": "08:30:00", "status": "COMPLETED", "notes": "...",
        "exercises": [
          { "exerciseId": "...", "exerciseName": "Bench Press", "setsExpected": 3, "repsExpected": 10, "weightExpected": 80.0, ...,
            "setsActual": 3, "repsActual": 10, "weightActual": 82.5, ..., "hasResult": true }
        ]
      }
    ]
  }

YOUR TASK: Create an Athlete Progress page that shows workout history and stats for a selected athlete.

STEP 1 -- Add TypeScript types:
  File: frontend/src/types/index.ts

  Add these interfaces:

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

STEP 2 -- Create API function:
  File: frontend/src/api/athleteProgress.ts

  import { client } from "./client";
  import type { AthleteProgressResponse } from "../types";

  export const getAthleteProgress = (
    athleteId: string,
    startDate?: string,
    endDate?: string
  ) =>
    client
      .get<AthleteProgressResponse>(`/athletes/${athleteId}/progress`, {
        params: { startDate, endDate },
      })
      .then((res) => res.data);

STEP 3 -- Create React Query hook:
  File: frontend/src/hooks/useAthleteProgress.ts

  export function useAthleteProgress(athleteId: string, startDate?: string, endDate?: string) {
    return useQuery({
      queryKey: ["athleteProgress", athleteId, { startDate, endDate }],
      queryFn: () => getAthleteProgress(athleteId, startDate, endDate),
      enabled: !!athleteId,
    });
  }

STEP 4 -- Create the Athlete Progress page:
  File: frontend/src/pages/AthleteProgressPage.tsx

  This page should contain:

  a) A header section with:
     - Back button ("Back to Athletes") using useNavigate
     - Athlete name (large heading)
     - Date of birth and coach name as muted text below

  b) Stats cards row (4 cards in a grid):
     - Total Workouts (show totalWorkouts number)
     - Completed (show completedCount, green accent)
     - Missed (show missedCount, red accent)
     - Completion Rate (show completionRate as "XX.X%", use a subtle progress indicator or just the number)

  c) Workout history section:
     - Section heading "Workout History"
     - A Table component with columns: Date, Time, Label, Status, Exercises, Actions
     - Each row shows:
       - Date formatted as "MMM d, yyyy" (use date-fns format)
       - Time formatted as "HH:mm" or "—" if null
       - Workout label
       - Status as a colored Badge (green for COMPLETED, red for MISSED, gray/outline for PENDING)
       - Exercise count (e.g. "3 exercises")
       - A "View" button that navigates to /workouts/{workoutId}
     - Sorted by date descending (most recent first -- the backend already returns this order)
     - If no workouts, show an empty state

  d) Use standard shadcn components: Card, Table, Badge, Button.
     Use lucide-react icons: ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Eye.

STEP 5 -- Add the route:
  File: frontend/src/App.tsx

  Add a new route inside the AppLayout Route:
    <Route path="/athletes/:id" element={<AthleteProgressPage />} />

  Make sure to import AthleteProgressPage. Place this route BEFORE the "/athletes" route so it doesn't conflict.

STEP 6 -- Make athlete names clickable:
  File: frontend/src/pages/AthletesPage.tsx

  In the athletes table, wrap the athlete name in a Link (from react-router-dom) that navigates to /athletes/{athlete.id}:
    <Link to={`/athletes/${a.id}`} className="font-medium text-primary hover:underline">
      {a.name}
    </Link>

  Import Link from react-router-dom.

STEP 7 -- Verify:
  Run: cd frontend && npx tsc --noEmit
  (Should pass with no errors)

  Then start both backend and frontend:
  - Go to the Athletes page, click an athlete name -> should navigate to the progress page
  - The progress page should show stats cards and workout history
  - Clicking "View" on a workout should go to the workout detail page
  - The back button should return to the athletes list

IMPORTANT:
- You ARE modifying App.tsx and AthletesPage.tsx. Be careful to preserve existing functionality.
- The route /athletes/:id MUST come before /athletes in the route list, or use exact matching, so that /athletes/:id doesn't catch the /athletes route.
- Actually in React Router v6+, more specific routes match first regardless of order. But to be safe, place /athletes/:id before /athletes.
- Use the same visual style as the rest of the app (shadcn components, same spacing, same font sizes).
- The stats card for completion rate should handle the case where totalWorkouts is 0 (show "0%" or "N/A").
- Run npx tsc --noEmit to verify no type errors.
```

---

## Agent 20 -- Frontend: Month & Day Calendar Views

**Attach:** `@frontend/src/pages/CalendarPage.tsx` `@frontend/src/components/calendar/WeeklyCalendar.tsx` `@frontend/src/components/calendar/CalendarHeader.tsx` `@frontend/src/components/calendar/CalendarFilterBar.tsx` `@frontend/src/components/calendar/DayColumn.tsx` `@frontend/src/components/calendar/WorkoutCard.tsx` `@frontend/src/hooks/useCalendar.ts` `@frontend/src/lib/dateUtils.ts` `@frontend/src/types/index.ts`

```
You are adding features to the frontend of an Athlete Management App.

You have full access to run any shell commands (npm, etc.) inside the project at /Users/nunesj/trainning-management-app.

The frontend/ is a React + TypeScript app using Vite, TanStack React Query, shadcn/ui, and Tailwind CSS v4. Read ALL the attached source files carefully before starting.

Currently the calendar only has a weekly view (WeeklyCalendar.tsx). The backend GET /api/workouts endpoint accepts startDate and endDate query params and returns WorkoutSummary[] (which now includes status and scheduledTime from Agent 18).

YOUR TASK: Add Monthly and Daily calendar views with a view-mode switcher.

STEP 1 -- Add the CalendarTimeScale type:
  File: frontend/src/types/index.ts

  Add:
    export type CalendarTimeScale = "day" | "week" | "month";

STEP 2 -- Add date utility functions:
  File: frontend/src/lib/dateUtils.ts

  Add these helper functions (use date-fns):

    import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

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

  Keep all existing functions intact.

STEP 3 -- Create MonthlyCalendar component:
  File: frontend/src/components/calendar/MonthlyCalendar.tsx

  This component should:
  a) Accept the same filter props as WeeklyCalendar (viewMode, selectedCoachId, selectedAthleteId, etc.) OR manage its own state similarly to WeeklyCalendar.

  b) Navigation: prev/next month buttons + Today button. Display "March 2026" style header.

  c) Render a standard month grid:
     - 7 columns (Mon-Sun)
     - Row of day-of-week headers (Mon, Tue, ..., Sun)
     - 5-6 rows of day cells, starting from the Monday of the week containing the 1st of the month
     - Days outside the current month should be visually muted

  d) Each day cell shows:
     - The day number
     - Small colored dots or a count badge for workouts on that day (e.g., "3 workouts")
     - Color-code dots by status: green=completed, red=missed, gray=pending
     - Today should be highlighted (e.g., blue circle around the number)

  e) Clicking a day cell should call an onDayClick callback that the parent uses to switch to the Day view for that date.

  f) Fetch workouts for the entire visible month range (including partial weeks) using useCalendarWorkouts with the appropriate startDate/endDate.

  g) Include CalendarFilterBar (reuse the existing component).

STEP 4 -- Create DailyCalendar component:
  File: frontend/src/components/calendar/DailyCalendar.tsx

  This component should:
  a) Navigation: prev/next day buttons + Today button. Display "Monday, March 9, 2026" style header.

  b) Main content area split into two sections:

     Section 1 -- "Unscheduled" (top area):
     - Shows WorkoutCards for workouts on this day that have NO scheduledTime.

     Section 2 -- Time grid:
     - A vertical time grid from 06:00 to 22:00 (or 00:00-23:00), with 1-hour slot rows.
     - Each row shows the hour label on the left (e.g. "08:00", "09:00").
     - WorkoutCards are positioned in the correct time slot based on scheduledTime.
     - If multiple workouts at the same hour, stack them horizontally or vertically within the slot.

  c) Clicking a workout card navigates to /workouts/{id} (reuse WorkoutCard).

  d) Include a "+" button or click-on-slot to create a new workout for that day/time.

  e) Fetch workouts for just the single day using useCalendarWorkouts with startDate=endDate=that day.

  f) Include CalendarFilterBar (reuse existing component).

STEP 5 -- Update CalendarPage to orchestrate views:
  File: frontend/src/pages/CalendarPage.tsx

  a) Add state for the active time scale: const [timeScale, setTimeScale] = useState<CalendarTimeScale>("week");
  b) Add state for the selected date (used when switching to day view from month view): const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  c) Render a view-mode switcher at the top -- three buttons/tabs: Day | Week | Month.
     Use a segmented control style (e.g., 3 buttons in a group with the active one using variant="default" and others "outline").

  d) Conditionally render:
     - "day" -> <DailyCalendar date={selectedDate} onDateChange={setSelectedDate} />
     - "week" -> <WeeklyCalendar /> (existing)
     - "month" -> <MonthlyCalendar onDayClick={(date) => { setSelectedDate(date); setTimeScale("day"); }} />

  e) When clicking a day in the month view, switch to day view for that date.

STEP 6 -- Refactor shared state (optional but recommended):
  If the filter bar state (viewMode, coachId, athleteId) should persist when switching between Day/Week/Month views, lift the filter state into CalendarPage and pass it as props to all three calendar components. This way the user's filter selection is preserved when switching views.

STEP 7 -- Verify:
  Run: cd frontend && npx tsc --noEmit
  (Should pass)

  Then start both backend and frontend:
  - The calendar page should show Day/Week/Month toggle buttons
  - Week view should work exactly as before
  - Month view should show a month grid with workout indicators per day
  - Clicking a day in month view should switch to day view
  - Day view should show an unscheduled section and a time grid
  - All views should respect the filter bar (All/By Coach/By Athlete)
  - Creating workouts still works from all views

IMPORTANT:
- You ARE modifying CalendarPage.tsx and potentially dateUtils.ts and types/index.ts. Preserve all existing code.
- Do NOT modify WeeklyCalendar.tsx unless necessary for prop changes. It should continue to work as-is.
- The month grid should start on Monday (consistent with the weekly view).
- Use date-fns for all date calculations (already a dependency).
- Reuse the existing WorkoutCard component in all views.
- Reuse the existing CalendarFilterBar component.
- Run npx tsc --noEmit to verify no type errors.
```

---

## Agent 21 -- Frontend: Styling Improvements

**Attach:** `@frontend/src/index.css` `@frontend/src/components/layout/AppLayout.tsx` `@frontend/src/pages/AthletesPage.tsx` `@frontend/src/pages/ExercisesPage.tsx` `@frontend/src/pages/WorkoutDetailPage.tsx` `@frontend/src/pages/CalendarPage.tsx` `@frontend/src/components/calendar/WorkoutCard.tsx` `@frontend/src/components/calendar/DayColumn.tsx`

```
You are improving the visual design of an Athlete Management App frontend.

You have full access to run any shell commands (npm, etc.) inside the project at /Users/nunesj/trainning-management-app.

The frontend/ is a React + TypeScript app using Vite, shadcn/ui, Tailwind CSS v4, and Geist font. The theme is defined in src/index.css using CSS custom properties with OKLCH colors. Read ALL attached files carefully.

YOUR TASK: Improve the overall styling, visual hierarchy, and polish of the app. Do NOT change functionality -- only appearance.

STEP 1 -- Update the color theme:
  File: frontend/src/index.css

  a) Replace the neutral-only palette with a branded color scheme. Use an indigo/blue accent as the primary color:

  Light mode primary tokens (replace existing):
    --primary: oklch(0.55 0.22 265);
    --primary-foreground: oklch(0.985 0 0);

  Dark mode primary tokens (replace existing):
    --primary: oklch(0.65 0.22 265);
    --primary-foreground: oklch(0.15 0 0);

  b) Add semantic status color tokens (add these to BOTH :root and .dark):

  :root additions:
    --success: oklch(0.55 0.17 155);
    --success-foreground: oklch(0.985 0 0);
    --warning: oklch(0.75 0.15 85);
    --warning-foreground: oklch(0.25 0 0);

  .dark additions:
    --success: oklch(0.65 0.17 155);
    --success-foreground: oklch(0.15 0 0);
    --warning: oklch(0.75 0.15 85);
    --warning-foreground: oklch(0.15 0 0);

  c) Add the color mappings to the @theme inline block:
    --color-success: var(--success);
    --color-success-foreground: var(--success-foreground);
    --color-warning: var(--warning);
    --color-warning-foreground: var(--warning-foreground);

  d) Adjust the sidebar colors to use the new primary for the active item:
    --sidebar-primary: oklch(0.55 0.22 265);  (light)
    --sidebar-primary: oklch(0.65 0.22 265);  (dark)

STEP 2 -- Improve AppLayout:
  File: frontend/src/components/layout/AppLayout.tsx

  a) Add a mobile sidebar toggle:
     - Add a hamburger menu button (Menu icon from lucide-react) visible only on small screens (md:hidden).
     - Use state to toggle sidebar visibility on mobile.
     - The sidebar should overlay on mobile with a backdrop.
     - Add an X close button inside the mobile sidebar.

  b) Improve the sidebar visual:
     - Add a subtle bottom border to the logo section.
     - Add a version or app description text at the bottom of the sidebar (e.g., "v2.0" or a subtle "Training Management" text).

  c) Add a subtle shadow or border-bottom to the header that appears on scroll (optional, skip if complex).

STEP 3 -- Improve page headers:
  Apply consistent page header styling across all pages:

  a) AthletesPage.tsx:
     - Use a subtle gradient or colored top border on the page.
     - Improve the empty state with a larger icon (Users icon) and better spacing.

  b) ExercisesPage.tsx:
     - Same header pattern as Athletes.
     - Improve the parameter badges to use more distinct, softer colors.

STEP 4 -- Improve WorkoutDetailPage:
  File: frontend/src/pages/WorkoutDetailPage.tsx

  - Wrap the content in a Card for better visual containment.
  - Add a colored top border to the card based on workout status (green for completed, red for missed, primary for pending).

STEP 5 -- Improve calendar components:
  a) DayColumn.tsx:
     - Improve the today highlight with the brand color (primary) instead of generic gray.
     - Add a subtle background color to day columns on hover.

  b) WorkoutCard.tsx:
     - Add a left border color based on workout status (3px solid border-left).
     - Improve hover state with a subtle scale transform or shadow lift.

STEP 6 -- Add loading skeletons (optional but nice):
  Where the app currently shows a Loader2 spinner, consider replacing with skeleton loading states using shimmer placeholders for a more polished loading experience. At minimum, do this for the calendar view.

STEP 7 -- Verify:
  Run: cd frontend && npx tsc --noEmit
  (Should pass)

  Then start the frontend and do a visual check:
  - The app should have a blue/indigo accent color instead of pure gray
  - The sidebar should have the branded active state
  - Mobile view should show a hamburger menu that opens the sidebar
  - Workout cards should have colored left borders based on status
  - The overall app should feel more polished and cohesive
  - Dark mode should work correctly with the new colors (toggle via browser/system preference)

IMPORTANT:
- You ARE modifying multiple existing files. Be VERY careful not to break any functionality.
- Do NOT change any logic, state management, API calls, or routing. Only change visual/styling code.
- Keep all existing Tailwind classes that handle layout (flex, grid, gap, padding, etc.). Only add/modify color and decorative classes.
- Make sure the app still works identically in terms of features.
- Test that both light and dark modes look good.
- Run npx tsc --noEmit to verify no type errors.
```
