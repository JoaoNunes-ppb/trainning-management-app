package com.athletemanager.workoutexercise

import com.athletemanager.coach.Coach
import com.athletemanager.athlete.Athlete
import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.exercise.Exercise
import com.athletemanager.exercise.ExerciseRepository
import com.athletemanager.exercise.Modality
import com.athletemanager.workout.Workout
import com.athletemanager.workout.WorkoutRepository
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
class WorkoutExerciseServiceTest {

    @MockK
    private lateinit var workoutExerciseRepository: WorkoutExerciseRepository

    @MockK
    private lateinit var workoutRepository: WorkoutRepository

    @MockK
    private lateinit var exerciseRepository: ExerciseRepository

    @InjectMockKs
    private lateinit var service: WorkoutExerciseService

    private val coach = Coach(id = UUID.randomUUID(), name = "Coach A")
    private val athlete = Athlete(id = UUID.randomUUID(), name = "Athlete A", email = "a@test.com", coach = coach)
    private val workout = Workout(id = UUID.randomUUID(), label = "Leg Day", date = LocalDate.now(), athlete = athlete)
    private val exercise = Exercise(id = UUID.randomUUID(), name = "Squat", hasSets = true, hasReps = true, hasWeight = true, modality = Modality.LIVRE)

    @Test
    fun `listByWorkout returns ordered list`() {
        val we1 = WorkoutExercise(id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise)
        val we2 = WorkoutExercise(id = UUID.randomUUID(), orderIndex = 1, workout = workout, exercise = exercise)

        every { workoutRepository.existsById(workout.id!!) } returns true
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we1, we2)

        val result = service.listByWorkout(workout.id!!)

        assertThat(result).hasSize(2)
        assertThat(result[0].orderIndex).isEqualTo(0)
        assertThat(result[1].orderIndex).isEqualTo(1)
        verify { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) }
    }

    @Test
    fun `listByWorkout throws when workout not found`() {
        val id = UUID.randomUUID()
        every { workoutRepository.existsById(id) } returns false

        assertThrows<ResourceNotFoundException> {
            service.listByWorkout(id)
        }
    }

    @Test
    fun `add creates workout exercise with all fields including loads`() {
        val request = AddWorkoutExerciseRequest(
            exerciseId = exercise.id!!,
            orderIndex = 0,
            notes = "Go heavy",
            setsExpected = 4,
            repsExpected = 8,
            weightExpected = BigDecimal("100.00"),
            distanceExpected = BigDecimal("0.00"),
            timeExpected = 60,
            concentricLoad = BigDecimal("80.00"),
            eccentricLoad = BigDecimal("90.00"),
            isometricLoad = BigDecimal("70.00")
        )

        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)
        every { exerciseRepository.findById(exercise.id!!) } returns Optional.of(exercise)
        every { workoutExerciseRepository.save(any()) } answers {
            val saved = firstArg<WorkoutExercise>()
            WorkoutExercise(
                id = UUID.randomUUID(),
                orderIndex = saved.orderIndex,
                notes = saved.notes,
                setsExpected = saved.setsExpected,
                repsExpected = saved.repsExpected,
                weightExpected = saved.weightExpected,
                distanceExpected = saved.distanceExpected,
                timeExpected = saved.timeExpected,
                concentricLoad = saved.concentricLoad,
                eccentricLoad = saved.eccentricLoad,
                isometricLoad = saved.isometricLoad,
                workout = saved.workout,
                exercise = saved.exercise
            )
        }

        val result = service.add(workout.id!!, request)

        assertThat(result.orderIndex).isEqualTo(0)
        assertThat(result.notes).isEqualTo("Go heavy")
        assertThat(result.setsExpected).isEqualTo(4)
        assertThat(result.repsExpected).isEqualTo(8)
        assertThat(result.weightExpected).isEqualByComparingTo(BigDecimal("100.00"))
        assertThat(result.concentricLoad).isEqualByComparingTo(BigDecimal("80.00"))
        assertThat(result.eccentricLoad).isEqualByComparingTo(BigDecimal("90.00"))
        assertThat(result.isometricLoad).isEqualByComparingTo(BigDecimal("70.00"))
        assertThat(result.exerciseId).isEqualTo(exercise.id)
        assertThat(result.exerciseName).isEqualTo("Squat")
        verify { workoutExerciseRepository.save(any()) }
    }

    @Test
    fun `add throws when workout not found`() {
        val badWorkoutId = UUID.randomUUID()
        val request = AddWorkoutExerciseRequest(exerciseId = exercise.id!!, orderIndex = 0)

        every { workoutRepository.findById(badWorkoutId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.add(badWorkoutId, request)
        }
    }

    @Test
    fun `add throws when exercise not found`() {
        val badExerciseId = UUID.randomUUID()
        val request = AddWorkoutExerciseRequest(exerciseId = badExerciseId, orderIndex = 0)

        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)
        every { exerciseRepository.findById(badExerciseId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.add(workout.id!!, request)
        }
    }

    @Test
    fun `update modifies fields and saves`() {
        val weId = UUID.randomUUID()
        val existing = WorkoutExercise(
            id = weId, orderIndex = 0, notes = "old", setsExpected = 3,
            workout = workout, exercise = exercise
        )
        val request = UpdateWorkoutExerciseRequest(
            orderIndex = 1,
            notes = "updated",
            setsExpected = 5,
            repsExpected = 10,
            weightExpected = BigDecimal("120.00"),
            concentricLoad = BigDecimal("85.00"),
            eccentricLoad = BigDecimal("95.00"),
            isometricLoad = BigDecimal("75.00")
        )

        every { workoutExerciseRepository.findById(weId) } returns Optional.of(existing)
        every { workoutExerciseRepository.save(any()) } answers { firstArg() }

        val result = service.update(workout.id!!, weId, request)

        assertThat(result.orderIndex).isEqualTo(1)
        assertThat(result.notes).isEqualTo("updated")
        assertThat(result.setsExpected).isEqualTo(5)
        assertThat(result.repsExpected).isEqualTo(10)
        assertThat(result.weightExpected).isEqualByComparingTo(BigDecimal("120.00"))
        assertThat(result.concentricLoad).isEqualByComparingTo(BigDecimal("85.00"))
        verify { workoutExerciseRepository.save(existing) }
    }

    @Test
    fun `update throws when workout exercise does not belong to workout`() {
        val weId = UUID.randomUUID()
        val otherWorkout = Workout(id = UUID.randomUUID(), label = "Other", date = LocalDate.now(), athlete = athlete)
        val existing = WorkoutExercise(id = weId, orderIndex = 0, workout = otherWorkout, exercise = exercise)
        val request = UpdateWorkoutExerciseRequest(orderIndex = 1)

        every { workoutExerciseRepository.findById(weId) } returns Optional.of(existing)

        assertThrows<ResourceNotFoundException> {
            service.update(workout.id!!, weId, request)
        }
    }

    @Test
    fun `delete removes workout exercise`() {
        val weId = UUID.randomUUID()
        val existing = WorkoutExercise(id = weId, orderIndex = 0, workout = workout, exercise = exercise)

        every { workoutExerciseRepository.findById(weId) } returns Optional.of(existing)
        every { workoutExerciseRepository.delete(existing) } just Runs

        service.delete(workout.id!!, weId)

        verify { workoutExerciseRepository.delete(existing) }
    }

    @Test
    fun `delete throws when workout exercise does not belong to workout`() {
        val weId = UUID.randomUUID()
        val otherWorkout = Workout(id = UUID.randomUUID(), label = "Other", date = LocalDate.now(), athlete = athlete)
        val existing = WorkoutExercise(id = weId, orderIndex = 0, workout = otherWorkout, exercise = exercise)

        every { workoutExerciseRepository.findById(weId) } returns Optional.of(existing)

        assertThrows<ResourceNotFoundException> {
            service.delete(workout.id!!, weId)
        }
    }

    @Test
    fun `reorder assigns new orderIndex values based on position`() {
        val id1 = UUID.randomUUID()
        val id2 = UUID.randomUUID()
        val id3 = UUID.randomUUID()
        val we1 = WorkoutExercise(id = id1, orderIndex = 0, workout = workout, exercise = exercise)
        val we2 = WorkoutExercise(id = id2, orderIndex = 1, workout = workout, exercise = exercise)
        val we3 = WorkoutExercise(id = id3, orderIndex = 2, workout = workout, exercise = exercise)

        every { workoutRepository.existsById(workout.id!!) } returns true
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we1, we2, we3)
        every { workoutExerciseRepository.saveAll(any<List<WorkoutExercise>>()) } answers { firstArg() }

        service.reorder(workout.id!!, listOf(id3, id1, id2))

        assertThat(we3.orderIndex).isEqualTo(0)
        assertThat(we1.orderIndex).isEqualTo(1)
        assertThat(we2.orderIndex).isEqualTo(2)
        verify { workoutExerciseRepository.saveAll(any<List<WorkoutExercise>>()) }
    }

    @Test
    fun `reorder throws when ids do not match`() {
        val we1 = WorkoutExercise(id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise)

        every { workoutRepository.existsById(workout.id!!) } returns true
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we1)

        assertThrows<BusinessRuleException> {
            service.reorder(workout.id!!, listOf(UUID.randomUUID()))
        }
    }
}
