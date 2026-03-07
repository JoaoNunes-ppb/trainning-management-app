package com.athletemanager.coach

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateCoachRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String
)

data class CoachResponse(
    val id: UUID,
    val name: String
)

fun Coach.toResponse() = CoachResponse(
    id = this.id!!,
    name = this.name
)
