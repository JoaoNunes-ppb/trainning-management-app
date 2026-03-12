package com.athletemanager.exerciseresult

import com.athletemanager.athlete.Athlete
import com.athletemanager.coach.Coach
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.exercise.Exercise
import com.athletemanager.exercise.Modality
import com.athletemanager.workout.Workout
import com.athletemanager.workoutexercise.WorkoutExercise
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

@ExtendWith(MockKExtension::class)
class ExerciseResultServiceTest {

    @MockK
    private lateinit var exerciseResultRepository: ExerciseResultRepository

    @MockK
    private lateinit var workoutExerciseRepository: WorkoutExerciseRepository

    @InjectMockKs
    private lateinit var service: ExerciseResultService

    private val coach = Coach(id = UUID.randomUUID(), name = "Coach A")
    private val athlete = Athlete(id = UUID.randomUUID(), name = "Athlete A", email = "a@test.com", coach = coach)
    private val workout = Workout(id = UUID.randomUUID(), label = "Leg Day", date = LocalDate.now(), athlete = athlete)
    private val exercise = Exercise(id = UUID.randomUUID(), name = "Squat", hasSets = true, hasReps = true, hasWeight = true, modality = Modality.LIVRE)

    private fun createWorkoutExercise(id: UUID = UUID.randomUUID()) =
        WorkoutExercise(id = id, orderIndex = 0, workout = workout, exercise = exercise)

    private fun createResult(
        id: UUID = UUID.randomUUID(),
        workoutExercise: WorkoutExercise,
        sets: Int? = 3,
        reps: Int? = 10,
        weight: BigDecimal? = BigDecimal("100.00")
    ) = ExerciseResult(
        id = id,
        sets = sets,
        reps = reps,
        weight = weight,
        workoutExercise = workoutExercise
    )

    @Test
    fun `get returns response when found`() {
        val we = createWorkoutExercise()
        val result = createResult(workoutExercise = we)

        every { workoutExerciseRepository.existsById(we.id!!) } returns true
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns result

        val response = service.get(we.id!!)

        assertThat(response.id).isEqualTo(result.id)
        assertThat(response.workoutExerciseId).isEqualTo(we.id)
        assertThat(response.sets).isEqualTo(3)
        assertThat(response.reps).isEqualTo(10)
        assertThat(response.weight).isEqualByComparingTo(BigDecimal("100.00"))
    }

    @Test
    fun `get throws ResourceNotFoundException when workout exercise not found`() {
        val weId = UUID.randomUUID()

        every { workoutExerciseRepository.existsById(weId) } returns false

        assertThrows<ResourceNotFoundException> {
            service.get(weId)
        }
    }

    @Test
    fun `get throws ResourceNotFoundException when result not found`() {
        val weId = UUID.randomUUID()

        every { workoutExerciseRepository.existsById(weId) } returns true
        every { exerciseResultRepository.findByWorkoutExerciseId(weId) } returns null

        assertThrows<ResourceNotFoundException> {
            service.get(weId)
        }
    }

    @Test
    fun `upsert creates new result when none exists`() {
        val we = createWorkoutExercise()
        val request = UpsertExerciseResultRequest(
            sets = 4,
            reps = 12,
            weight = BigDecimal("80.00"),
            notes = "Felt strong"
        )

        every { workoutExerciseRepository.findById(we.id!!) } returns Optional.of(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns null
        every { exerciseResultRepository.save(any()) } answers {
            val r = firstArg<ExerciseResult>()
            ExerciseResult(
                id = UUID.randomUUID(),
                sets = r.sets,
                reps = r.reps,
                weight = r.weight,
                distance = r.distance,
                time = r.time,
                notes = r.notes,
                concentricLoad = r.concentricLoad,
                eccentricLoad = r.eccentricLoad,
                isometricLoad = r.isometricLoad,
                workoutExercise = r.workoutExercise
            )
        }

        val response = service.upsert(we.id!!, request)

        assertThat(response.sets).isEqualTo(4)
        assertThat(response.reps).isEqualTo(12)
        assertThat(response.weight).isEqualByComparingTo(BigDecimal("80.00"))
        assertThat(response.notes).isEqualTo("Felt strong")
        assertThat(response.workoutExerciseId).isEqualTo(we.id)
        verify { exerciseResultRepository.save(any()) }
    }

    @Test
    fun `upsert updates existing result`() {
        val we = createWorkoutExercise()
        val existing = createResult(workoutExercise = we, sets = 3, reps = 10, weight = BigDecimal("100.00"))
        val request = UpsertExerciseResultRequest(
            sets = 5,
            reps = 8,
            weight = BigDecimal("110.00")
        )

        every { workoutExerciseRepository.findById(we.id!!) } returns Optional.of(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns existing
        every { exerciseResultRepository.save(any()) } answers { firstArg() }

        val response = service.upsert(we.id!!, request)

        assertThat(response.sets).isEqualTo(5)
        assertThat(response.reps).isEqualTo(8)
        assertThat(response.weight).isEqualByComparingTo(BigDecimal("110.00"))
        verify { exerciseResultRepository.save(existing) }
    }

    @Test
    fun `upsert with Kineo loads sets concentric, eccentric, and isometric`() {
        val we = createWorkoutExercise()
        val request = UpsertExerciseResultRequest(
            sets = 3,
            reps = 10,
            concentricLoad = BigDecimal("60.00"),
            eccentricLoad = BigDecimal("70.00"),
            isometricLoad = BigDecimal("50.00")
        )

        every { workoutExerciseRepository.findById(we.id!!) } returns Optional.of(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns null
        every { exerciseResultRepository.save(any()) } answers {
            val r = firstArg<ExerciseResult>()
            ExerciseResult(
                id = UUID.randomUUID(),
                sets = r.sets,
                reps = r.reps,
                weight = r.weight,
                distance = r.distance,
                time = r.time,
                notes = r.notes,
                concentricLoad = r.concentricLoad,
                eccentricLoad = r.eccentricLoad,
                isometricLoad = r.isometricLoad,
                workoutExercise = r.workoutExercise
            )
        }

        val response = service.upsert(we.id!!, request)

        assertThat(response.concentricLoad).isEqualByComparingTo(BigDecimal("60.00"))
        assertThat(response.eccentricLoad).isEqualByComparingTo(BigDecimal("70.00"))
        assertThat(response.isometricLoad).isEqualByComparingTo(BigDecimal("50.00"))
    }

    @Test
    fun `upsert throws ResourceNotFoundException when workout exercise not found`() {
        val weId = UUID.randomUUID()
        val request = UpsertExerciseResultRequest(sets = 3)

        every { workoutExerciseRepository.findById(weId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.upsert(weId, request)
        }
    }

    @Test
    fun `delete removes result when found`() {
        val we = createWorkoutExercise()
        val result = createResult(workoutExercise = we)

        every { workoutExerciseRepository.existsById(we.id!!) } returns true
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns result
        every { exerciseResultRepository.delete(result) } just Runs

        service.delete(we.id!!)

        verify { exerciseResultRepository.delete(result) }
    }

    @Test
    fun `delete throws ResourceNotFoundException when workout exercise not found`() {
        val weId = UUID.randomUUID()

        every { workoutExerciseRepository.existsById(weId) } returns false

        assertThrows<ResourceNotFoundException> {
            service.delete(weId)
        }
    }

    @Test
    fun `delete throws ResourceNotFoundException when result not found`() {
        val weId = UUID.randomUUID()

        every { workoutExerciseRepository.existsById(weId) } returns true
        every { exerciseResultRepository.findByWorkoutExerciseId(weId) } returns null

        assertThrows<ResourceNotFoundException> {
            service.delete(weId)
        }
    }
}
