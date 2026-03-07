package com.athletemanager.athlete

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/athletes")
class AthleteController(
    private val athleteService: AthleteService,
    private val athleteProgressService: AthleteProgressService
) {

    @GetMapping
    fun findAll(@RequestParam(required = false) coachId: UUID?): ResponseEntity<List<AthleteResponse>> =
        ResponseEntity.ok(athleteService.findAll(coachId))

    @PostMapping
    fun create(@Valid @RequestBody request: CreateAthleteRequest): ResponseEntity<AthleteResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(athleteService.create(request))

    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ResponseEntity<AthleteResponse> =
        ResponseEntity.ok(athleteService.findById(id))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateAthleteRequest
    ): ResponseEntity<AthleteResponse> =
        ResponseEntity.ok(athleteService.update(id, request))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        athleteService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/progress")
    fun getProgress(
        @PathVariable id: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?
    ): ResponseEntity<AthleteProgressResponse> =
        ResponseEntity.ok(athleteProgressService.getProgress(id, startDate, endDate))
}
