package com.athletemanager.exercise

import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ExerciseService(
    private val exerciseRepository: ExerciseRepository,
    private val workoutExerciseRepository: WorkoutExerciseRepository
) {

    @Transactional(readOnly = true)
    fun findAll(): List<ExerciseResponse> =
        exerciseRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun findById(id: UUID): ExerciseResponse {
        val exercise = exerciseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Exercise not found with id: $id") }
        return exercise.toResponse()
    }

    fun create(request: CreateExerciseRequest): ExerciseResponse {
        validateAtLeastOneParameter(request)
        val exercise = Exercise(
            name = request.name,
            description = request.description,
            hasSets = request.hasSets,
            hasReps = request.hasReps,
            hasWeight = request.hasWeight,
            hasDistance = request.hasDistance,
            hasTime = request.hasTime
        )
        return exerciseRepository.save(exercise).toResponse()
    }

    fun update(id: UUID, request: CreateExerciseRequest): ExerciseResponse {
        validateAtLeastOneParameter(request)
        val exercise = exerciseRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Exercise not found with id: $id") }
        exercise.name = request.name
        exercise.description = request.description
        exercise.hasSets = request.hasSets
        exercise.hasReps = request.hasReps
        exercise.hasWeight = request.hasWeight
        exercise.hasDistance = request.hasDistance
        exercise.hasTime = request.hasTime
        return exerciseRepository.save(exercise).toResponse()
    }

    fun delete(id: UUID) {
        if (!exerciseRepository.existsById(id)) {
            throw ResourceNotFoundException("Exercise not found with id: $id")
        }
        if (workoutExerciseRepository.countByExerciseId(id) > 0) {
            throw BusinessRuleException("Cannot delete exercise that is used in workouts")
        }
        exerciseRepository.deleteById(id)
    }

    private fun validateAtLeastOneParameter(request: CreateExerciseRequest) {
        if (!request.hasSets && !request.hasReps && !request.hasWeight &&
            !request.hasDistance && !request.hasTime
        ) {
            throw BusinessRuleException("At least one parameter must be enabled")
        }
    }
}
