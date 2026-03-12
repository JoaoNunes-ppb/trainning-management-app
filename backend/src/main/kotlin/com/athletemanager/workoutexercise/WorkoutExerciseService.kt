package com.athletemanager.workoutexercise

import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.exercise.ExerciseRepository
import com.athletemanager.workout.WorkoutRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class WorkoutExerciseService(
    private val workoutExerciseRepository: WorkoutExerciseRepository,
    private val workoutRepository: WorkoutRepository,
    private val exerciseRepository: ExerciseRepository
) {

    @Transactional(readOnly = true)
    fun listByWorkout(workoutId: UUID): List<WorkoutExerciseResponse> {
        if (!workoutRepository.existsById(workoutId)) {
            throw ResourceNotFoundException("Workout not found with id: $workoutId")
        }
        return workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workoutId)
            .map { it.toResponse() }
    }

    fun add(workoutId: UUID, request: AddWorkoutExerciseRequest): WorkoutExerciseResponse {
        val workout = workoutRepository.findById(workoutId)
            .orElseThrow { ResourceNotFoundException("Workout not found with id: $workoutId") }
        val exercise = exerciseRepository.findById(request.exerciseId)
            .orElseThrow { ResourceNotFoundException("Exercise not found with id: ${request.exerciseId}") }

        val workoutExercise = WorkoutExercise(
            orderIndex = request.orderIndex,
            notes = request.notes,
            setsExpected = request.setsExpected,
            repsExpected = request.repsExpected,
            weightExpected = request.weightExpected,
            distanceExpected = request.distanceExpected,
            timeExpected = request.timeExpected,
            concentricLoad = request.concentricLoad,
            eccentricLoad = request.eccentricLoad,
            isometricLoad = request.isometricLoad,
            workout = workout,
            exercise = exercise
        )
        return workoutExerciseRepository.save(workoutExercise).toResponse()
    }

    fun update(workoutId: UUID, id: UUID, request: UpdateWorkoutExerciseRequest): WorkoutExerciseResponse {
        val workoutExercise = workoutExerciseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout exercise not found with id: $id") }

        if (workoutExercise.workout.id != workoutId) {
            throw ResourceNotFoundException("Workout exercise $id does not belong to workout $workoutId")
        }

        workoutExercise.orderIndex = request.orderIndex
        workoutExercise.notes = request.notes
        workoutExercise.setsExpected = request.setsExpected
        workoutExercise.repsExpected = request.repsExpected
        workoutExercise.weightExpected = request.weightExpected
        workoutExercise.distanceExpected = request.distanceExpected
        workoutExercise.timeExpected = request.timeExpected
        workoutExercise.concentricLoad = request.concentricLoad
        workoutExercise.eccentricLoad = request.eccentricLoad
        workoutExercise.isometricLoad = request.isometricLoad

        return workoutExerciseRepository.save(workoutExercise).toResponse()
    }

    fun delete(workoutId: UUID, id: UUID) {
        val workoutExercise = workoutExerciseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Workout exercise not found with id: $id") }

        if (workoutExercise.workout.id != workoutId) {
            throw ResourceNotFoundException("Workout exercise $id does not belong to workout $workoutId")
        }

        workoutExerciseRepository.delete(workoutExercise)
    }

    fun reorder(workoutId: UUID, orderedIds: List<UUID>) {
        if (!workoutRepository.existsById(workoutId)) {
            throw ResourceNotFoundException("Workout not found with id: $workoutId")
        }

        val exercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workoutId)
        val existingIds = exercises.map { it.id }.toSet()

        if (orderedIds.toSet() != existingIds) {
            throw BusinessRuleException("Provided IDs do not match the workout's exercises")
        }

        val exerciseMap = exercises.associateBy { it.id }
        orderedIds.forEachIndexed { index, uuid ->
            exerciseMap[uuid]!!.orderIndex = index
        }
        workoutExerciseRepository.saveAll(exercises)
    }
}
