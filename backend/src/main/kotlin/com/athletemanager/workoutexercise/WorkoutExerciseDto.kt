package com.athletemanager.workoutexercise

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.util.UUID

data class AddWorkoutExerciseRequest(
    @field:NotNull
    val exerciseId: UUID,

    @field:NotNull
    @field:Min(0)
    val orderIndex: Int,

    val notes: String? = null,
    val setsExpected: Int? = null,
    val repsExpected: Int? = null,
    val weightExpected: BigDecimal? = null,
    val distanceExpected: BigDecimal? = null,
    val timeExpected: Int? = null,
    val concentricLoad: BigDecimal? = null,
    val eccentricLoad: BigDecimal? = null,
    val isometricLoad: BigDecimal? = null
)

data class UpdateWorkoutExerciseRequest(
    @field:NotNull
    @field:Min(0)
    val orderIndex: Int,

    val notes: String? = null,
    val setsExpected: Int? = null,
    val repsExpected: Int? = null,
    val weightExpected: BigDecimal? = null,
    val distanceExpected: BigDecimal? = null,
    val timeExpected: Int? = null,
    val concentricLoad: BigDecimal? = null,
    val eccentricLoad: BigDecimal? = null,
    val isometricLoad: BigDecimal? = null
)

data class ReorderRequest(val orderedIds: List<UUID>)

data class WorkoutExerciseResponse(
    val id: UUID,
    val exerciseId: UUID,
    val exerciseName: String,
    val orderIndex: Int,
    val notes: String?,
    val setsExpected: Int?,
    val repsExpected: Int?,
    val weightExpected: BigDecimal?,
    val distanceExpected: BigDecimal?,
    val timeExpected: Int?,
    val concentricLoad: BigDecimal?,
    val eccentricLoad: BigDecimal?,
    val isometricLoad: BigDecimal?
)

fun WorkoutExercise.toResponse() = WorkoutExerciseResponse(
    id = this.id!!,
    exerciseId = this.exercise.id!!,
    exerciseName = this.exercise.name,
    orderIndex = this.orderIndex,
    notes = this.notes,
    setsExpected = this.setsExpected,
    repsExpected = this.repsExpected,
    weightExpected = this.weightExpected,
    distanceExpected = this.distanceExpected,
    timeExpected = this.timeExpected,
    concentricLoad = this.concentricLoad,
    eccentricLoad = this.eccentricLoad,
    isometricLoad = this.isometricLoad
)
