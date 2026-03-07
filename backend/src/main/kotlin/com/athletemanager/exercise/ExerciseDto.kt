package com.athletemanager.exercise

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateExerciseRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    val description: String? = null,
    val hasSets: Boolean = false,
    val hasReps: Boolean = false,
    val hasWeight: Boolean = false,
    val hasDistance: Boolean = false,
    val hasTime: Boolean = false
)

data class ExerciseResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val hasSets: Boolean,
    val hasReps: Boolean,
    val hasWeight: Boolean,
    val hasDistance: Boolean,
    val hasTime: Boolean
)

fun Exercise.toResponse() = ExerciseResponse(
    id = this.id!!,
    name = this.name,
    description = this.description,
    hasSets = this.hasSets,
    hasReps = this.hasReps,
    hasWeight = this.hasWeight,
    hasDistance = this.hasDistance,
    hasTime = this.hasTime
)
