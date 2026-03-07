package com.athletemanager.exerciseresult

import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ExerciseResultService(
    private val exerciseResultRepository: ExerciseResultRepository,
    private val workoutExerciseRepository: WorkoutExerciseRepository
) {

    @Transactional(readOnly = true)
    fun get(workoutExerciseId: UUID): ExerciseResultResponse {
        if (!workoutExerciseRepository.existsById(workoutExerciseId)) {
            throw ResourceNotFoundException("Workout exercise not found with id: $workoutExerciseId")
        }
        val result = exerciseResultRepository.findByWorkoutExerciseId(workoutExerciseId)
            ?: throw ResourceNotFoundException("Exercise result not found for workout exercise: $workoutExerciseId")
        return result.toResponse()
    }

    fun upsert(workoutExerciseId: UUID, request: UpsertExerciseResultRequest): ExerciseResultResponse {
        val workoutExercise = workoutExerciseRepository.findById(workoutExerciseId)
            .orElseThrow { ResourceNotFoundException("Workout exercise not found with id: $workoutExerciseId") }

        val result = exerciseResultRepository.findByWorkoutExerciseId(workoutExerciseId)
            ?: ExerciseResult(workoutExercise = workoutExercise)

        result.sets = request.sets
        result.reps = request.reps
        result.weight = request.weight
        result.distance = request.distance
        result.time = request.time
        result.notes = request.notes

        return exerciseResultRepository.save(result).toResponse()
    }

    fun delete(workoutExerciseId: UUID) {
        if (!workoutExerciseRepository.existsById(workoutExerciseId)) {
            throw ResourceNotFoundException("Workout exercise not found with id: $workoutExerciseId")
        }
        val result = exerciseResultRepository.findByWorkoutExerciseId(workoutExerciseId)
            ?: throw ResourceNotFoundException("Exercise result not found for workout exercise: $workoutExerciseId")
        exerciseResultRepository.delete(result)
    }

    private fun ExerciseResult.toResponse() = ExerciseResultResponse(
        id = this.id!!,
        workoutExerciseId = this.workoutExercise.id!!,
        sets = this.sets,
        reps = this.reps,
        weight = this.weight,
        distance = this.distance,
        time = this.time,
        notes = this.notes
    )
}
