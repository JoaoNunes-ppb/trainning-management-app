# API Contract

All endpoints use JSON request/response bodies. The base path is `/api`.

UUIDs are represented as strings in JSON. Dates use `YYYY-MM-DD` format.

## 1. Coaches

### GET /api/coaches

List all coaches.

**Response 200:**

```json
[
  {
    "id": "uuid",
    "name": "Coach Mike"
  }
]
```

### POST /api/coaches

Create a new coach.

**Request:**

```json
{
  "name": "Coach Mike"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "name": "Coach Mike"
}
```

**Validation:**
- `name`: required, non-blank, max 255 chars

### GET /api/coaches/{id}

Get a coach by ID.

**Response 200:**

```json
{
  "id": "uuid",
  "name": "Coach Mike"
}
```

**Response 404:** Coach not found.

### PUT /api/coaches/{id}

Update a coach.

**Request:**

```json
{
  "name": "Coach Michael"
}
```

**Response 200:** Returns the updated coach (same shape as GET).

**Response 404:** Coach not found.

### DELETE /api/coaches/{id}

Delete a coach and cascade to their athletes, workouts, etc.

**Response 204:** No content.

**Response 404:** Coach not found.

---

## 2. Athletes

### GET /api/athletes

List athletes. Supports optional filtering.

**Query Parameters:**
- `coachId` (UUID, optional): Filter by coach.

**Response 200:**

```json
[
  {
    "id": "uuid",
    "name": "Alex Johnson",
    "dateOfBirth": "1995-03-15",
    "coachId": "uuid",
    "coachName": "Coach Mike",
    "notes": "Marathon runner"
  }
]
```

### POST /api/athletes

Create a new athlete.

**Request:**

```json
{
  "name": "Alex Johnson",
  "dateOfBirth": "1995-03-15",
  "coachId": "uuid",
  "notes": "Marathon runner"
}
```

**Response 201:** Returns the created athlete (same shape as list item).

**Validation:**
- `name`: required, non-blank, max 255 chars
- `coachId`: required, must reference an existing coach
- `dateOfBirth`: optional
- `notes`: optional

### GET /api/athletes/{id}

Get an athlete by ID.

**Response 200:** Single athlete object (same shape as list item).

**Response 404:** Athlete not found.

### PUT /api/athletes/{id}

Update an athlete.

**Request:** Same shape as POST.

**Response 200:** Returns the updated athlete.

**Response 404:** Athlete not found.

### DELETE /api/athletes/{id}

Delete an athlete and cascade to their workouts.

**Response 204:** No content.

**Response 404:** Athlete not found.

---

## 3. Exercises

### GET /api/exercises

List all exercise templates.

**Response 200:**

```json
[
  {
    "id": "uuid",
    "name": "Bench Press",
    "description": "Flat barbell bench press",
    "hasSets": true,
    "hasReps": true,
    "hasWeight": true,
    "hasDistance": false,
    "hasTime": false
  }
]
```

### POST /api/exercises

Create a new exercise template.

**Request:**

```json
{
  "name": "Bench Press",
  "description": "Flat barbell bench press",
  "hasSets": true,
  "hasReps": true,
  "hasWeight": true,
  "hasDistance": false,
  "hasTime": false
}
```

**Response 201:** Returns the created exercise.

**Validation:**
- `name`: required, non-blank, max 255 chars, unique
- `description`: optional
- `hasSets`, `hasReps`, `hasWeight`, `hasDistance`, `hasTime`: optional, default to `false`
- At least one parameter flag must be `true`.

### GET /api/exercises/{id}

Get an exercise template by ID.

**Response 200:** Single exercise object.

**Response 404:** Exercise not found.

### PUT /api/exercises/{id}

Update an exercise template.

**Request:** Same shape as POST.

**Response 200:** Returns the updated exercise.

**Response 404:** Exercise not found.

**Response 409:** Cannot update parameter flags if the exercise is already used in workouts with values for those parameters (application-level validation).

### DELETE /api/exercises/{id}

Delete an exercise template.

**Response 204:** No content.

**Response 404:** Exercise not found.

**Response 409:** Cannot delete if the exercise is used in any workout.

---

## 4. Workouts

### GET /api/workouts

List workouts with filtering. Used by the calendar to fetch workouts within a date range.

**Query Parameters:**
- `startDate` (DATE, required): Start of date range (inclusive).
- `endDate` (DATE, required): End of date range (inclusive).
- `coachId` (UUID, optional): Filter to athletes belonging to this coach.
- `athleteId` (UUID, optional): Filter to a specific athlete.

If neither `coachId` nor `athleteId` is provided, returns all workouts in the date range.

**Response 200:**

```json
[
  {
    "id": "uuid",
    "athleteId": "uuid",
    "athleteName": "Alex Johnson",
    "coachId": "uuid",
    "coachName": "Coach Mike",
    "label": "Upper Body Strength",
    "date": "2026-03-09",
    "notes": "Focus on form",
    "exerciseCount": 4,
    "hasResults": false
  }
]
```

The `exerciseCount` and `hasResults` fields support the calendar card display without fetching full workout details.

### POST /api/workouts

Create a new workout.

**Request:**

```json
{
  "athleteId": "uuid",
  "label": "Upper Body Strength",
  "date": "2026-03-09",
  "notes": "Focus on form"
}
```

**Response 201:** Returns the created workout (same shape as list item, with `exerciseCount: 0` and `hasResults: false`).

**Validation:**
- `athleteId`: required, must reference an existing athlete
- `label`: required, non-blank, max 255 chars
- `date`: required
- `notes`: optional

### GET /api/workouts/{id}

Get full workout details including exercises and their results.

**Response 200:**

```json
{
  "id": "uuid",
  "athleteId": "uuid",
  "athleteName": "Alex Johnson",
  "coachId": "uuid",
  "coachName": "Coach Mike",
  "label": "Upper Body Strength",
  "date": "2026-03-09",
  "notes": "Focus on form",
  "exercises": [
    {
      "id": "uuid",
      "exerciseId": "uuid",
      "exerciseName": "Bench Press",
      "orderIndex": 0,
      "notes": "Warm up first",
      "setsExpected": 3,
      "repsExpected": 10,
      "weightExpected": 80.00,
      "distanceExpected": null,
      "timeExpected": null,
      "exercise": {
        "id": "uuid",
        "name": "Bench Press",
        "hasSets": true,
        "hasReps": true,
        "hasWeight": true,
        "hasDistance": false,
        "hasTime": false
      },
      "result": {
        "id": "uuid",
        "sets": 3,
        "reps": 8,
        "weight": 80.00,
        "distance": null,
        "time": null,
        "notes": "Could not finish last set"
      }
    }
  ]
}
```

The `exercise` nested object provides the parameter flags so the frontend knows which fields to display. The `result` field is `null` if no result has been logged.

**Response 404:** Workout not found.

### PUT /api/workouts/{id}

Update a workout's metadata (does not modify exercises).

**Request:**

```json
{
  "athleteId": "uuid",
  "label": "Upper Body Strength v2",
  "date": "2026-03-10",
  "notes": "Updated notes"
}
```

**Response 200:** Returns the updated workout summary (list item shape).

**Response 404:** Workout not found.

### DELETE /api/workouts/{id}

Delete a workout and cascade to its exercises and results.

**Response 204:** No content.

**Response 404:** Workout not found.

---

## 5. Workout Exercises

Nested under a workout. Manages the exercises within a specific workout.

### POST /api/workouts/{workoutId}/exercises

Add an exercise to a workout.

**Request:**

```json
{
  "exerciseId": "uuid",
  "orderIndex": 0,
  "notes": "Go slow on eccentric",
  "setsExpected": 3,
  "repsExpected": 10,
  "weightExpected": 80.00,
  "distanceExpected": null,
  "timeExpected": null
}
```

**Response 201:** Returns the created workout exercise (same shape as the `exercises[]` item in GET /api/workouts/{id}, including nested `exercise` object, `result` will be `null`).

**Validation:**
- `exerciseId`: required, must reference an existing exercise
- `orderIndex`: required, non-negative integer, must not conflict with existing entries
- Expected value fields: optional, should only be provided for parameters enabled on the exercise template

### PUT /api/workouts/{workoutId}/exercises/{id}

Update a workout exercise (reorder, change notes, change expected values).

**Request:**

```json
{
  "orderIndex": 1,
  "notes": "Updated notes",
  "setsExpected": 4,
  "repsExpected": 8,
  "weightExpected": 85.00,
  "distanceExpected": null,
  "timeExpected": null
}
```

Note: `exerciseId` cannot be changed. To swap an exercise, delete and re-create.

**Response 200:** Returns the updated workout exercise.

**Response 404:** Workout or workout exercise not found.

### DELETE /api/workouts/{workoutId}/exercises/{id}

Remove an exercise from a workout (cascades to its result).

**Response 204:** No content.

**Response 404:** Workout or workout exercise not found.

### PUT /api/workouts/{workoutId}/exercises/reorder

Bulk reorder exercises within a workout.

**Request:**

```json
{
  "orderedIds": ["uuid-1", "uuid-3", "uuid-2"]
}
```

The array contains all workout exercise IDs in the desired order. The backend assigns `order_index` values 0, 1, 2, ... based on array position.

**Response 200:**

```json
{
  "success": true
}
```

**Response 400:** If the provided IDs don't match the workout's exercises.

---

## 6. Exercise Results

Manages actual performance results for a workout exercise.

### PUT /api/workout-exercises/{workoutExerciseId}/result

Create or update the result for a workout exercise (upsert).

**Request:**

```json
{
  "sets": 3,
  "reps": 8,
  "weight": 80.00,
  "distance": null,
  "time": null,
  "notes": "Could not finish last set"
}
```

**Response 200:** Returns the result.

```json
{
  "id": "uuid",
  "workoutExerciseId": "uuid",
  "sets": 3,
  "reps": 8,
  "weight": 80.00,
  "distance": null,
  "time": null,
  "notes": "Could not finish last set"
}
```

**Response 404:** Workout exercise not found.

### GET /api/workout-exercises/{workoutExerciseId}/result

Get the result for a workout exercise.

**Response 200:** Returns the result (same shape as PUT response).

**Response 404:** Workout exercise or result not found.

### DELETE /api/workout-exercises/{workoutExerciseId}/result

Clear/delete the result for a workout exercise.

**Response 204:** No content.

**Response 404:** Workout exercise not found.

---

## 7. Error Response Format

All error responses follow a consistent format:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Athlete not found with id: uuid",
  "timestamp": "2026-03-06T10:30:00Z"
}
```

**Common HTTP status codes:**
- `400` Bad Request: Validation errors
- `404` Not Found: Resource not found
- `409` Conflict: Business rule violation (e.g., deleting an exercise in use)
- `500` Internal Server Error: Unexpected errors

For validation errors (400), the response includes field-level details:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2026-03-06T10:30:00Z",
  "fieldErrors": {
    "name": "must not be blank",
    "coachId": "must reference an existing coach"
  }
}
```
