package com.athletemanager.exercise

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/exercises")
class ExerciseController(private val exerciseService: ExerciseService) {

    @GetMapping
    fun findAll(): ResponseEntity<List<ExerciseResponse>> =
        ResponseEntity.ok(exerciseService.findAll())

    @PostMapping
    fun create(@Valid @RequestBody request: CreateExerciseRequest): ResponseEntity<ExerciseResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(exerciseService.create(request))

    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ResponseEntity<ExerciseResponse> =
        ResponseEntity.ok(exerciseService.findById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateExerciseRequest
    ): ResponseEntity<ExerciseResponse> =
        ResponseEntity.ok(exerciseService.update(id, request))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        exerciseService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
