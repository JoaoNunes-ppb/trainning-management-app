package com.athletemanager.workout

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class CreateWorkoutRequest(
    @field:NotNull
    val athleteId: UUID,

    @field:NotBlank
    @field:Size(max = 255)
    val label: String,

    @field:NotNull
    val date: LocalDate,

    val notes: String? = null,

    val scheduledTime: LocalTime? = null
)

data class WorkoutSummaryResponse(
    val id: UUID,
    val athleteId: UUID,
    val athleteName: String,
    val coachId: UUID,
    val coachName: String,
    val label: String,
    val date: LocalDate,
    val notes: String?,
    val status: String,
    val scheduledTime: LocalTime?,
    val exerciseCount: Int,
    val hasResults: Boolean
)

fun Workout.toSummaryResponse(exerciseCount: Int = 0, hasResults: Boolean = false) = WorkoutSummaryResponse(
    id = this.id!!,
    athleteId = this.athlete.id!!,
    athleteName = this.athlete.name,
    coachId = this.athlete.coach.id!!,
    coachName = this.athlete.coach.name,
    label = this.label,
    date = this.date,
    notes = this.notes,
    status = this.status,
    scheduledTime = this.scheduledTime,
    exerciseCount = exerciseCount,
    hasResults = hasResults
)

data class WorkoutDetailResponse(
    val id: UUID,
    val athleteId: UUID,
    val athleteName: String,
    val coachId: UUID,
    val coachName: String,
    val label: String,
    val date: LocalDate,
    val notes: String?,
    val status: String,
    val scheduledTime: LocalTime?,
    val exercises: List<WorkoutExerciseDetailResponse>
)

data class UpdateWorkoutStatusRequest(
    @field:NotBlank val status: String
)

data class WorkoutExerciseDetailResponse(
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
    val isometricLoad: BigDecimal?,
    val exercise: ExerciseInfo,
    val result: ExerciseResultInfo?
)

data class ExerciseInfo(
    val id: UUID,
    val name: String,
    val hasSets: Boolean,
    val hasReps: Boolean,
    val hasWeight: Boolean,
    val hasDistance: Boolean,
    val hasTime: Boolean,
    val modality: String,
    val kineoType: String?
)

data class ExerciseResultInfo(
    val id: UUID,
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
