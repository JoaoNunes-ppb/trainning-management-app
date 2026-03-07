package com.athletemanager.athlete

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate
import java.util.UUID

data class CreateAthleteRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    val dateOfBirth: LocalDate? = null,

    @field:NotNull
    val coachId: UUID,

    val notes: String? = null
)

data class AthleteResponse(
    val id: UUID,
    val name: String,
    val dateOfBirth: LocalDate?,
    val coachId: UUID,
    val coachName: String,
    val notes: String?
)

fun Athlete.toResponse() = AthleteResponse(
    id = this.id!!,
    name = this.name,
    dateOfBirth = this.dateOfBirth,
    coachId = this.coach.id!!,
    coachName = this.coach.name,
    notes = this.notes
)
