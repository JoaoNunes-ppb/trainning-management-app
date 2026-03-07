package com.athletemanager.workoutexercise

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/workouts/{workoutId}/exercises")
class WorkoutExerciseController(private val workoutExerciseService: WorkoutExerciseService) {

    @GetMapping
    fun listByWorkout(@PathVariable workoutId: UUID): ResponseEntity<List<WorkoutExerciseResponse>> =
        ResponseEntity.ok(workoutExerciseService.listByWorkout(workoutId))

    @PostMapping
    fun add(
        @PathVariable workoutId: UUID,
        @Valid @RequestBody request: AddWorkoutExerciseRequest
    ): ResponseEntity<WorkoutExerciseResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(workoutExerciseService.add(workoutId, request))

    @PutMapping("/{id}")
    fun update(
        @PathVariable workoutId: UUID,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateWorkoutExerciseRequest
    ): ResponseEntity<WorkoutExerciseResponse> =
        ResponseEntity.ok(workoutExerciseService.update(workoutId, id, request))

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable workoutId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<Void> {
        workoutExerciseService.delete(workoutId, id)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/reorder")
    fun reorder(
        @PathVariable workoutId: UUID,
        @RequestBody request: ReorderRequest
    ): ResponseEntity<Map<String, Boolean>> {
        workoutExerciseService.reorder(workoutId, request.orderedIds)
        return ResponseEntity.ok(mapOf("success" to true))
    }
}
