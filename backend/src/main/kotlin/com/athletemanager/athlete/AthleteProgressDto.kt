package com.athletemanager.athlete

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class AthleteProgressResponse(
    val athlete: AthleteResponse,
    val stats: ProgressStats,
    val workouts: List<WorkoutProgressItem>
)

data class ProgressStats(
    val totalWorkouts: Int,
    val completedCount: Int,
    val missedCount: Int,
    val pendingCount: Int,
    val completionRate: Double
)

data class WorkoutProgressItem(
    val id: UUID,
    val label: String,
    val date: LocalDate,
    val scheduledTime: LocalTime?,
    val status: String,
    val notes: String?,
    val exercises: List<ExerciseProgressItem>
)

data class ExerciseProgressItem(
    val exerciseId: UUID,
    val exerciseName: String,
    val setsExpected: Int?,
    val repsExpected: Int?,
    val weightExpected: BigDecimal?,
    val distanceExpected: BigDecimal?,
    val timeExpected: Int?,
    val setsActual: Int?,
    val repsActual: Int?,
    val weightActual: BigDecimal?,
    val distanceActual: BigDecimal?,
    val timeActual: Int?,
    val hasResult: Boolean
)
