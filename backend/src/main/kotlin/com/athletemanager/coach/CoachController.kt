package com.athletemanager.coach

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/coaches")
class CoachController(private val coachService: CoachService) {

    @GetMapping
    fun findAll(): ResponseEntity<List<CoachResponse>> =
        ResponseEntity.ok(coachService.findAll())

    @PostMapping
    fun create(@Valid @RequestBody request: CreateCoachRequest): ResponseEntity<CoachResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(coachService.create(request))

    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ResponseEntity<CoachResponse> =
        ResponseEntity.ok(coachService.findById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateCoachRequest
    ): ResponseEntity<CoachResponse> =
        ResponseEntity.ok(coachService.update(id, request))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        coachService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
