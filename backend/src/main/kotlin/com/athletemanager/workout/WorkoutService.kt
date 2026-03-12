package com.athletemanager.workout

import com.athletemanager.athlete.AthleteRepository
import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.exerciseresult.ExerciseResultRepository
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class WorkoutService(
    private val workoutRepository: WorkoutRepository,
    private val athleteRepository: AthleteRepository,
    private val workoutExerciseRepository: WorkoutExerciseRepository,
    private val exerciseResultRepository: ExerciseResultRepository
) {

    @Transactional(readOnly = true)
    fun findAll(
        startDate: LocalDate,
        endDate: LocalDate,
        coachId: UUID?,
        athleteId: UUID?
    ): List<WorkoutSummaryResponse> {
        val workouts = when {
            athleteId != null -> workoutRepository.findByAthleteIdAndDateBetween(athleteId, startDate, endDate)
            coachId != null -> workoutRepository.findByAthlete_Coach_IdAndDateBetween(coachId, startDate, endDate)
            else -> workoutRepository.findByDateBetween(startDate, endDate)
        }
        return workouts.map { workout ->
            val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!)
            val hasResults = exercises.any { exerciseResultRepository.findByWorkoutExerciseId(it.id!!) != null }
            workout.toSummaryResponse(exerciseCount = exercises.size, hasResults = hasResults)
        }
    }

    @Transactional(readOnly = true)
    fun findById(id: UUID): Workout {
        return workoutRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun findDetailById(id: UUID): WorkoutDetailResponse {
        val workout = findById(id)
        val workoutExercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!)

        val exerciseDetails = workoutExercises.map { we ->
            val exercise = we.exercise
            val result = exerciseResultRepository.findByWorkoutExerciseId(we.id!!)

            WorkoutExerciseDetailResponse(
                id = we.id!!,
                exerciseId = exercise.id!!,
                exerciseName = exercise.name,
                orderIndex = we.orderIndex,
                notes = we.notes,
                setsExpected = we.setsExpected,
                repsExpected = we.repsExpected,
                weightExpected = we.weightExpected,
                distanceExpected = we.distanceExpected,
                timeExpected = we.timeExpected,
                concentricLoad = we.concentricLoad,
                eccentricLoad = we.eccentricLoad,
                isometricLoad = we.isometricLoad,
                exercise = ExerciseInfo(
                    id = exercise.id!!,
                    name = exercise.name,
                    hasSets = exercise.hasSets,
                    hasReps = exercise.hasReps,
                    hasWeight = exercise.hasWeight,
                    hasDistance = exercise.hasDistance,
                    hasTime = exercise.hasTime,
                    modality = exercise.modality.name,
                    kineoType = exercise.kineoType?.name
                ),
                result = result?.let {
                    ExerciseResultInfo(
                        id = it.id!!,
                        sets = it.sets,
                        reps = it.reps,
                        weight = it.weight,
                        distance = it.distance,
                        time = it.time,
                        notes = it.notes
                    )
                }
            )
        }

        return WorkoutDetailResponse(
            id = workout.id!!,
            athleteId = workout.athlete.id!!,
            athleteName = workout.athlete.name,
            coachId = workout.athlete.coach.id!!,
            coachName = workout.athlete.coach.name,
            label = workout.label,
            date = workout.date,
            notes = workout.notes,
            status = workout.status,
            scheduledTime = workout.scheduledTime,
            exercises = exerciseDetails
        )
    }

    @Transactional(readOnly = true)
    fun findSummaryById(id: UUID): WorkoutSummaryResponse {
        val workout = findById(id)
        val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!)
        val hasResults = exercises.any { exerciseResultRepository.findByWorkoutExerciseId(it.id!!) != null }
        return workout.toSummaryResponse(exerciseCount = exercises.size, hasResults = hasResults)
    }

    fun create(request: CreateWorkoutRequest): WorkoutSummaryResponse {
        val athlete = athleteRepository.findById(request.athleteId)
            .orElseThrow { ResourceNotFoundException("Athlete not found with id: ${request.athleteId}") }
        val workout = Workout(
            label = request.label,
            date = request.date,
            notes = request.notes,
            scheduledTime = request.scheduledTime,
            athlete = athlete
        )
        return workoutRepository.save(workout).toSummaryResponse()
    }

    fun update(id: UUID, request: CreateWorkoutRequest): WorkoutSummaryResponse {
        val workout = workoutRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout not found with id: $id") }
        val athlete = athleteRepository.findById(request.athleteId)
            .orElseThrow { ResourceNotFoundException("Athlete not found with id: ${request.athleteId}") }
        workout.label = request.label
        workout.date = request.date
        workout.notes = request.notes
        workout.scheduledTime = request.scheduledTime
        workout.athlete = athlete
        val saved = workoutRepository.save(workout)
        val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(saved.id!!)
        val hasResults = exercises.any { exerciseResultRepository.findByWorkoutExerciseId(it.id!!) != null }
        return saved.toSummaryResponse(exerciseCount = exercises.size, hasResults = hasResults)
    }

    fun updateStatus(id: UUID, request: UpdateWorkoutStatusRequest): WorkoutSummaryResponse {
        val allowedStatuses = setOf("PENDING", "COMPLETED", "MISSED")
        if (request.status !in allowedStatuses) {
            throw BusinessRuleException("Status must be one of: PENDING, COMPLETED, MISSED")
        }
        val workout = workoutRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout not found with id: $id") }
        workout.status = request.status
        val saved = workoutRepository.save(workout)
        val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(saved.id!!)
        val hasResults = exercises.any { exerciseResultRepository.findByWorkoutExerciseId(it.id!!) != null }
        return saved.toSummaryResponse(exerciseCount = exercises.size, hasResults = hasResults)
    }

    fun delete(id: UUID) {
        if (!workoutRepository.existsById(id)) {
            throw ResourceNotFoundException("Workout not found with id: $id")
        }
        workoutRepository.deleteById(id)
    }
}
