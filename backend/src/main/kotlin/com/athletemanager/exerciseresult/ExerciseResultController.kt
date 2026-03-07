package com.athletemanager.exerciseresult

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/workout-exercises/{workoutExerciseId}/result")
class ExerciseResultController(private val exerciseResultService: ExerciseResultService) {

    @GetMapping
    fun get(@PathVariable workoutExerciseId: UUID): ResponseEntity<ExerciseResultResponse> =
        ResponseEntity.ok(exerciseResultService.get(workoutExerciseId))

    @PutMapping
    fun upsert(
        @PathVariable workoutExerciseId: UUID,
        @RequestBody request: UpsertExerciseResultRequest
    ): ResponseEntity<ExerciseResultResponse> =
        ResponseEntity.ok(exerciseResultService.upsert(workoutExerciseId, request))

    @DeleteMapping
    fun delete(@PathVariable workoutExerciseId: UUID): ResponseEntity<Void> {
        exerciseResultService.delete(workoutExerciseId)
        return ResponseEntity.noContent().build()
    }
}
