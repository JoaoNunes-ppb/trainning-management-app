package com.athletemanager.exerciseresult

import java.math.BigDecimal
import java.util.UUID

data class UpsertExerciseResultRequest(
    val sets: Int? = null,
    val reps: Int? = null,
    val weight: BigDecimal? = null,
    val distance: BigDecimal? = null,
    val time: Int? = null,
    val notes: String? = null,
    val concentricLoad: BigDecimal? = null,
    val eccentricLoad: BigDecimal? = null,
    val isometricLoad: BigDecimal? = null
)

data class ExerciseResultResponse(
    val id: UUID,
    val workoutExerciseId: UUID,
    val sets: Int?,
    val reps: Int?,
    val weight: BigDecimal?,
    val distance: BigDecimal?,
    val time: Int?,
    val notes: String?,
    val concentricLoad: BigDecimal?,
    val eccentricLoad: BigDecimal?,
    val isometricLoad: BigDecimal?
)
