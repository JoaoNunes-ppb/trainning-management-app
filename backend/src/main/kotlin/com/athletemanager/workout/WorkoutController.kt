package com.athletemanager.workout

import jakarta.validation.Valid
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/workouts")
class WorkoutController(private val workoutService: WorkoutService) {

    @GetMapping
    fun findAll(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) coachId: UUID?,
        @RequestParam(required = false) athleteId: UUID?
    ): ResponseEntity<List<WorkoutSummaryResponse>> =
        ResponseEntity.ok(workoutService.findAll(startDate, endDate, coachId, athleteId))

    @PostMapping
    fun create(@Valid @RequestBody request: CreateWorkoutRequest): ResponseEntity<WorkoutSummaryResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(workoutService.create(request))

    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ResponseEntity<WorkoutDetailResponse> =
        ResponseEntity.ok(workoutService.findDetailById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateWorkoutRequest
    ): ResponseEntity<WorkoutSummaryResponse> =
        ResponseEntity.ok(workoutService.update(id, request))

    @PatchMapping("/{id}/status")
    fun updateStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateWorkoutStatusRequest
    ): ResponseEntity<WorkoutSummaryResponse> =
        ResponseEntity.ok(workoutService.updateStatus(id, request))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        workoutService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
