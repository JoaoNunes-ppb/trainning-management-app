# Product Requirements Document (PRD)

## 1. Product Overview

The **Athlete Management App** is a web application for a small four-person coaching team to plan and manage athlete workouts through a calendar interface.

Coaches can create athletes, build an exercise library with configurable parameters, compose workouts from those exercises, schedule them on specific days, and log actual results after sessions.

The product replaces spreadsheets and scattered notes with a simple, fast, centralized tool.

## 2. Users

There is a single user role: **Coach**.

- Coaches are stored in the database.
- Coaches share one authenticated application account.
- The coach selector in the top bar filters and organizes data; it is not an authorization boundary.
- Multiple coaches can exist, each managing their own group of athletes.

## 3. Access and Permissions

Every authenticated coach can cover another coach's leave. Athlete assignment
identifies the usual coach but never limits training operations.

| Action | Rule |
|--------|------|
| View calendar (all athletes) | Always allowed -- any coach can see everyone's schedule |
| View workout detail (any athlete) | Always allowed |
| Create/edit/delete athletes | Allowed; athlete remains assigned to a selected coach |
| Create/edit/copy/delete workouts | Allowed for every athlete |
| Add/edit/delete exercises in a workout | Allowed for every athlete |
| Log/edit/clear results | Allowed for every athlete |
| Manage exercise library | All coaches (shared resource) |
| Manage coaches (CRUD) | All coaches (admin-like, no restrictions) |

## 4. Core Features

### 4.1 Coach Management

- Coaches are managed via a **dedicated page** (`/coaches`) accessible from the sidebar.
- A coach can create, edit, and delete coach profiles.
- A global coach selector (dropdown) in the top bar allows switching the active coach identity.
- The selected coach determines the default “Os Meus Atletas” filter.
- At the bottom of the coach selector dropdown, a "Gerir Treinadores" link navigates to the coaches page.

### 4.2 Athlete Management

- A coach can create, edit, and delete **only their own athletes**.
- Each athlete belongs to exactly one coach.
- Athlete fields: name, date of birth, notes (optional).
- The athletes page only shows athletes belonging to the active coach. There is no way to see or manage other coaches' athletes from this page.
- The coachId is automatically set from the active coach on create (not selectable).

### 4.3 Exercise Library

- Coaches can create, edit, and delete exercise templates.
- Exercise templates are global (shared across all coaches).
- Each exercise defines which parameter fields apply to it. The available parameter types are:
  - **Sets** (integer)
  - **Reps** (integer)
  - **Weight** (decimal, kg)
  - **Distance** (decimal, meters)
  - **Time** (integer, seconds)
- All parameter types are optional. When creating an exercise, the coach toggles on/off which parameters are relevant (e.g., "Bench Press" enables sets, reps, weight; "5K Run" enables distance, time).
- Exercise fields: name, description (optional), and the five boolean flags for parameter applicability.

### 4.4 Workout Management

- A workout is a **one-off training session** tied to a specific athlete on a specific date.
- There are no reusable workout templates.
- Workout fields: label (name), date, notes (optional), athlete reference.
- A coach can create/edit/copy/delete workouts for any athlete.
- A workout contains an **ordered list of exercises** (WorkoutExercise entries).
- Each WorkoutExercise references an exercise template and can include:
  - Custom notes for that specific instance
  - Expected values for the parameters enabled on that exercise (e.g., setsExpected=3, repsExpected=10, weightExpected=80.0)
- The order of exercises within a workout matters (tracked via an order index).

### 4.5 Exercise Result Logging

- After (or during) a training session, the coach can log the actual results for each exercise in a workout.
- Each WorkoutExercise has an optional ExerciseResult containing the actual values achieved:
  - Sets, reps, weight, distance, time (matching the parameters enabled on the exercise template)
  - Notes (optional)
- Results are entered via an inline form on the workout detail page.
- Only the parameter fields enabled on the exercise template are shown for both expected values and results.

### 4.6 Weekly Calendar (Main Feature)

The calendar is the primary interface of the application.

**Layout:**
- A weekly grid showing 7 days (Monday to Sunday) as columns.
- Navigation arrows to move between weeks (previous/next). A "Today" button jumps to the current week.
- Workout cards displayed in the corresponding day column, showing the workout label and the athlete name.

**Three View Modes:**

| Mode | Description | Can create/edit? |
|------|-------------|-----------------|
| **Os Meus Atletas** (default) | Shows workouts for the active coach's athletes only. | Full control. Click day to create. Click card to edit. |
| **Todos os Atletas** | Shows all workouts across all coaches. | Full control for every athlete. |
| **Por Atleta** | Shows workouts for one selected athlete. | Full control for the selected athlete. |

A filter bar at the top of the calendar allows switching between these modes. The old "By Coach" dropdown (to pick a different coach) is removed.

**Interactions:**
- Clicking an empty day cell opens the create flow; “Por Atleta” first requires an athlete selection.
- Clicking a workout card navigates to a fully manageable workout detail page.
- The calendar defaults to "Os Meus Atletas".

Workout cards use the same styling and capabilities regardless of athlete assignment.

### 4.7 Data portability and recovery

- Authenticated users can export all operational data as a versioned ZIP of related CSV files.
- Import validates the complete package and displays counts before requiring destructive confirmation.
- Confirmed import atomically replaces operational data but retains login credentials.
- Automated PostgreSQL backups and off-machine copies remain the disaster-recovery mechanism.

## 5. User Stories

### Coach Management
- **US-1**: As a coach, I can create, edit, and delete coach profiles from a dedicated coaches page.
- **US-2**: As a coach, I can switch my identity using a dropdown so the system knows "who I am".

### Athlete Management
- **US-3**: As a coach, I can create a new athlete (automatically assigned to me).
- **US-4**: As a coach, I can edit my own athlete's details.
- **US-5**: As a coach, I can delete my own athlete (and their associated workouts).
- **US-6**: As a coach, I can view a list of my athletes only.

### Exercise Library
- **US-7**: As a coach, I can create an exercise template with a name, description, and selected parameter types.
- **US-8**: As a coach, I can edit an exercise template.
- **US-9**: As a coach, I can delete an exercise template.
- **US-10**: As a coach, I can browse all exercises in the library.

### Workout Management
- **US-11**: As a coach, I can create a workout for any athlete on a specific date.
- **US-12**: As a coach, I can add exercises to any athlete's workout and set expected values.
- **US-13**: As a coach, I can reorder exercises within any workout.
- **US-14**: As a coach, I can edit any workout's details (label, notes, date, athlete).
- **US-15**: As a coach, I can remove exercises from any workout.
- **US-16**: As a coach, I can delete any workout.
- **US-17**: As a coach, I can cover another coach without reassigning their athlete.

### Exercise Result Logging
- **US-18**: As a coach, I can log actual results in any athlete's workout.
- **US-19**: As a coach, I can edit any previously logged result.
- **US-20**: As a coach, I can clear any exercise result.

### Weekly Calendar
- **US-21**: As a coach, I can view "Os Meus Atletas" showing only my athletes' workouts (default view).
- **US-22**: As a coach, I can view and fully manage "Todos os Atletas".
- **US-23**: As a coach, I can view and fully manage one athlete through "Por Atleta".
- **US-24**: As a coach, I can navigate between weeks.
- **US-25**: As a coach, I can click on a day to create a workout for any athlete.
- **US-26**: As a coach, I can click any workout card to view and manage its details.

## 6. Scope

### In Scope (v1)
- Coach management (CRUD, dropdown selector)
- Athlete management (CRUD)
- Exercise library (CRUD with parameter configuration)
- Workout management (CRUD with ordered exercises)
- Exercise result logging
- Weekly calendar with three view modes

### Out of Scope
- Authentication and authorization
- Payments
- Notifications (email, push)
- Advanced analytics and reporting
- Monthly/daily calendar views
- Workout templates (reusable workout blueprints)
- Athlete self-service (athlete-facing UI)
- Mobile native app
