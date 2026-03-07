# Product Requirements Document (PRD)

## 1. Product Overview

The **Athlete Management App** is a web application for small coaching studios (1-3 coaches) to plan and manage athlete workouts through a calendar interface.

Coaches can create athletes, build an exercise library with configurable parameters, compose workouts from those exercises, schedule them on specific days, and log actual results after sessions.

The product replaces spreadsheets and scattered notes with a simple, fast, centralized tool.

## 2. Users

There is a single user role: **Coach**.

- Coaches are stored in the database.
- There is no authentication. The app displays a coach selector dropdown in the top bar; the coach picks their identity on load.
- Multiple coaches can exist, each managing their own group of athletes.

## 3. Core Features

### 3.1 Coach Management

- Coaches can be created and listed.
- A global coach selector (dropdown) allows switching the active coach context.
- The selected coach determines the default filter for the calendar view.

### 3.2 Athlete Management

- A coach can create, edit, and delete athletes.
- Each athlete belongs to exactly one coach.
- Athlete fields: name, date of birth, notes (optional).
- Athletes are listed in a dedicated page, filterable by coach.

### 3.3 Exercise Library

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

### 3.4 Workout Management

- A workout is a **one-off training session** tied to a specific athlete on a specific date.
- There are no reusable workout templates.
- Workout fields: label (name), date, notes (optional), athlete reference.
- A workout contains an **ordered list of exercises** (WorkoutExercise entries).
- Each WorkoutExercise references an exercise template and can include:
  - Custom notes for that specific instance
  - Expected values for the parameters enabled on that exercise (e.g., setsExpected=3, repsExpected=10, weightExpected=80.0)
- The order of exercises within a workout matters (tracked via an order index).

### 3.5 Exercise Result Logging

- After (or during) a training session, the coach can log the actual results for each exercise in a workout.
- Each WorkoutExercise has an optional ExerciseResult containing the actual values achieved:
  - Sets, reps, weight, distance, time (matching the parameters enabled on the exercise template)
  - Notes (optional)
- Results are entered via an inline form on the workout detail page.
- Only the parameter fields enabled on the exercise template are shown for both expected values and results.

### 3.6 Weekly Calendar (Main Feature)

The calendar is the primary interface of the application.

**Layout:**
- A weekly grid showing 7 days (Monday to Sunday) as columns.
- Navigation arrows to move between weeks (previous/next). A "Today" button jumps to the current week.
- Workout cards displayed in the corresponding day column, showing the workout label and the athlete name.

**Three View Modes:**

| Mode | Description |
|------|-------------|
| **All Athletes** | Shows all workouts for all athletes across all coaches. No filter applied. |
| **By Coach** | Shows all workouts for every athlete belonging to a selected coach. A coach dropdown filters the view. |
| **By Athlete** | Shows only the workouts for a single selected athlete. An athlete dropdown filters the view. |

A filter bar at the top of the calendar allows switching between these modes and selecting the relevant coach/athlete.

**Interactions:**
- Clicking an empty day cell opens a "create workout" flow (pre-filled with the date).
- Clicking a workout card navigates to the workout detail page.
- The calendar defaults to the "By Coach" view using the currently selected coach from the global coach selector.

## 4. User Stories

### Coach Management
- **US-1**: As a coach, I can create a new coach profile so that multiple coaches can use the system.
- **US-2**: As a coach, I can switch my identity using a dropdown so I see my own athletes and workouts.

### Athlete Management
- **US-3**: As a coach, I can create a new athlete with name, date of birth, and notes.
- **US-4**: As a coach, I can edit an athlete's details.
- **US-5**: As a coach, I can delete an athlete (and their associated workouts).
- **US-6**: As a coach, I can view a list of all my athletes.

### Exercise Library
- **US-7**: As a coach, I can create an exercise template with a name, description, and selected parameter types.
- **US-8**: As a coach, I can edit an exercise template.
- **US-9**: As a coach, I can delete an exercise template.
- **US-10**: As a coach, I can browse all exercises in the library.

### Workout Management
- **US-11**: As a coach, I can create a workout for an athlete on a specific date.
- **US-12**: As a coach, I can add exercises to a workout and set expected values for the applicable parameters.
- **US-13**: As a coach, I can reorder exercises within a workout.
- **US-14**: As a coach, I can edit a workout's details (label, notes, date).
- **US-15**: As a coach, I can remove exercises from a workout.
- **US-16**: As a coach, I can delete a workout entirely.

### Exercise Result Logging
- **US-17**: As a coach, I can log actual results for each exercise in a workout after or during a session.
- **US-18**: As a coach, I can edit previously logged results.
- **US-19**: As a coach, I can clear results for an exercise.

### Weekly Calendar
- **US-20**: As a coach, I can view a weekly calendar showing all workouts for all athletes.
- **US-21**: As a coach, I can filter the calendar to show only my athletes' workouts.
- **US-22**: As a coach, I can filter the calendar to show only a specific athlete's workouts.
- **US-23**: As a coach, I can navigate between weeks.
- **US-24**: As a coach, I can click on a day to create a new workout.
- **US-25**: As a coach, I can click on a workout card to view its details.

## 5. Scope

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
