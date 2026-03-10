# Product Requirements Document (PRD)

## 1. Product Overview

The **Athlete Management App** is a web application for small coaching studios (1-3 coaches) to plan and manage athlete workouts through a calendar interface.

Coaches can create athletes, build an exercise library with configurable parameters, compose workouts from those exercises, schedule them on specific days, and log actual results after sessions.

The product replaces spreadsheets and scattered notes with a simple, fast, centralized tool.

## 2. Users

There is a single user role: **Coach**.

- Coaches are stored in the database.
- There is no authentication. The app displays a coach selector dropdown in the top bar; the coach picks their identity on load.
- The selected coach represents **"who you are"** and determines what you can do (not just what you see).
- Multiple coaches can exist, each managing their own group of athletes.

## 3. Ownership and Permissions

The active coach controls all write operations. There is no server-side auth, so permissions are enforced in the frontend.

| Action | Rule |
|--------|------|
| View calendar (all athletes) | Always allowed -- any coach can see everyone's schedule |
| View workout detail (any athlete) | Always allowed -- read-only if the athlete belongs to another coach |
| Create/edit/delete athletes | Only for YOUR athletes (athlete.coachId == activeCoach.id) |
| Create workouts | Only for YOUR athletes |
| Edit/delete workouts | Only if the workout's athlete belongs to you |
| Add/edit/delete exercises in a workout | Only if the workout's athlete belongs to you |
| Log/edit/clear results | Only if the workout's athlete belongs to you |
| Manage exercise library | All coaches (shared resource) |
| Manage coaches (CRUD) | All coaches (admin-like, no restrictions) |

**Read-only mode**: When a coach views a workout belonging to another coach's athlete, the UI shows all data but hides all edit/delete/add buttons. A subtle banner indicates "read-only" status.

## 4. Core Features

### 4.1 Coach Management

- Coaches are managed via a **dedicated page** (`/coaches`) accessible from the sidebar.
- A coach can create, edit, and delete coach profiles.
- A global coach selector (dropdown) in the top bar allows switching the active coach identity.
- The selected coach determines ownership for all write actions.
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
- A coach can only create/edit/delete workouts for **their own athletes**.
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
| **Todos os Atletas** | Shows all workouts across all coaches. | Your athletes' cards are interactive. Other coaches' athletes' cards are **dimmed** and open in **read-only** mode. Clicking an empty day does NOT open create form. |
| **Por Atleta** | Shows workouts for a single selected athlete. Dropdown shows ALL athletes. | Full control if the athlete is yours. Read-only if the athlete belongs to another coach. |

A filter bar at the top of the calendar allows switching between these modes. The old "By Coach" dropdown (to pick a different coach) is removed.

**Interactions:**
- Clicking an empty day cell opens the "create workout" flow ONLY if the view is "Os Meus Atletas" or "Por Atleta" with your own athlete selected.
- Clicking a workout card navigates to the workout detail page (read-only if not your athlete).
- The calendar defaults to "Os Meus Atletas".

**Visual cues in "Todos os Atletas" mode:**
- Your athletes' workout cards appear with normal styling.
- Other coaches' athletes' workout cards appear with reduced opacity or a subtle border change to indicate they are read-only.
- Hovering over a read-only card shows a tooltip: "Treino de outro treinador".

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
- **US-11**: As a coach, I can create a workout for **my own athlete** on a specific date.
- **US-12**: As a coach, I can add exercises to my athlete's workout and set expected values.
- **US-13**: As a coach, I can reorder exercises within my athlete's workout.
- **US-14**: As a coach, I can edit my athlete's workout details (label, notes, date).
- **US-15**: As a coach, I can remove exercises from my athlete's workout.
- **US-16**: As a coach, I can delete my athlete's workout entirely.
- **US-17**: As a coach, I can view another coach's athlete's workout in read-only mode.

### Exercise Result Logging
- **US-18**: As a coach, I can log actual results for each exercise in my athlete's workout.
- **US-19**: As a coach, I can edit previously logged results for my athlete's workout.
- **US-20**: As a coach, I can clear results for an exercise in my athlete's workout.

### Weekly Calendar
- **US-21**: As a coach, I can view "Os Meus Atletas" showing only my athletes' workouts (default view).
- **US-22**: As a coach, I can view "Todos os Atletas" showing all workouts, with other coaches' athletes' cards visually dimmed and read-only.
- **US-23**: As a coach, I can view "Por Atleta" showing one athlete's workouts, with full or read-only access based on ownership.
- **US-24**: As a coach, I can navigate between weeks.
- **US-25**: As a coach, I can click on a day to create a new workout (only in "Os Meus Atletas" view or "Por Atleta" with my own athlete).
- **US-26**: As a coach, I can click on a workout card to view its details (read-only if not my athlete).

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
