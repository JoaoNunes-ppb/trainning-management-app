package com.athletemanager.workout

import com.athletemanager.athlete.Athlete
import com.athletemanager.athlete.AthleteRepository
import com.athletemanager.coach.Coach
import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.exercise.Exercise
import com.athletemanager.exercise.Modality
import com.athletemanager.exerciseresult.ExerciseResult
import com.athletemanager.exerciseresult.ExerciseResultRepository
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
import java.time.LocalTime
import java.util.*

@ExtendWith(MockKExtension::class)
class WorkoutServiceTest {

    @MockK
    private lateinit var workoutRepository: WorkoutRepository

    @MockK
    private lateinit var athleteRepository: AthleteRepository

    @MockK
    private lateinit var workoutExerciseRepository: WorkoutExerciseRepository

    @MockK
    private lateinit var exerciseResultRepository: ExerciseResultRepository

    @InjectMockKs
    private lateinit var service: WorkoutService

    private val coach = Coach(id = UUID.randomUUID(), name = "Coach A")
    private val athlete = Athlete(id = UUID.randomUUID(), name = "Athlete A", email = "a@test.com", coach = coach)
    private val today = LocalDate.now()

    private fun createWorkout(
        id: UUID = UUID.randomUUID(),
        label: String = "Workout",
        status: String = "PENDING"
    ) = Workout(id = id, label = label, date = today, athlete = athlete, status = status)

    @Test
    fun `findAll with athleteId filter`() {
        val workout = createWorkout()
        val startDate = today.minusDays(7)
        val endDate = today

        every { workoutRepository.findByAthleteIdAndDateBetween(athlete.id!!, startDate, endDate) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.findAll(startDate, endDate, coachId = null, athleteId = athlete.id)

        assertThat(result).hasSize(1)
        assertThat(result[0].athleteId).isEqualTo(athlete.id)
        verify { workoutRepository.findByAthleteIdAndDateBetween(athlete.id!!, startDate, endDate) }
    }

    @Test
    fun `findAll with coachId filter`() {
        val workout = createWorkout()
        val startDate = today.minusDays(7)
        val endDate = today

        every { workoutRepository.findByAthlete_Coach_IdAndDateBetween(coach.id!!, startDate, endDate) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.findAll(startDate, endDate, coachId = coach.id, athleteId = null)

        assertThat(result).hasSize(1)
        assertThat(result[0].coachId).isEqualTo(coach.id)
        verify { workoutRepository.findByAthlete_Coach_IdAndDateBetween(coach.id!!, startDate, endDate) }
    }

    @Test
    fun `findAll without filters`() {
        val workout = createWorkout()
        val startDate = today.minusDays(7)
        val endDate = today

        every { workoutRepository.findByDateBetween(startDate, endDate) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.findAll(startDate, endDate, coachId = null, athleteId = null)

        assertThat(result).hasSize(1)
        verify { workoutRepository.findByDateBetween(startDate, endDate) }
    }

    @Test
    fun `findAll computes exerciseCount and hasResults`() {
        val workout = createWorkout()
        val exercise = Exercise(id = UUID.randomUUID(), name = "Squat", hasSets = true, modality = Modality.LIVRE)
        val we = WorkoutExercise(id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise)
        val er = ExerciseResult(id = UUID.randomUUID(), workoutExercise = we)

        every { workoutRepository.findByDateBetween(any(), any()) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns er

        val result = service.findAll(today.minusDays(1), today, coachId = null, athleteId = null)

        assertThat(result[0].exerciseCount).isEqualTo(1)
        assertThat(result[0].hasResults).isTrue()
    }

    @Test
    fun `findById returns workout when found`() {
        val workout = createWorkout()
        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)

        val result = service.findById(workout.id!!)

        assertThat(result.id).isEqualTo(workout.id)
        assertThat(result.label).isEqualTo("Workout")
    }

    @Test
    fun `findById throws when not found`() {
        val id = UUID.randomUUID()
        every { workoutRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.findById(id)
        }
    }

    @Test
    fun `findDetailById returns full nested structure`() {
        val workout = createWorkout()
        val exercise = Exercise(
            id = UUID.randomUUID(), name = "Bench Press",
            hasSets = true, hasReps = true, hasWeight = true,
            modality = Modality.LIVRE
        )
        val we = WorkoutExercise(
            id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise,
            setsExpected = 3, repsExpected = 10, weightExpected = BigDecimal("80.00"),
            concentricLoad = BigDecimal("60.00"), eccentricLoad = BigDecimal("70.00")
        )
        val er = ExerciseResult(
            id = UUID.randomUUID(), workoutExercise = we,
            sets = 3, reps = 10, weight = BigDecimal("80.00"),
            concentricLoad = BigDecimal("60.00"), eccentricLoad = BigDecimal("70.00")
        )

        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns er

        val result = service.findDetailById(workout.id!!)

        assertThat(result.id).isEqualTo(workout.id)
        assertThat(result.athleteId).isEqualTo(athlete.id)
        assertThat(result.athleteName).isEqualTo("Athlete A")
        assertThat(result.coachId).isEqualTo(coach.id)
        assertThat(result.exercises).hasSize(1)

        val exDetail = result.exercises[0]
        assertThat(exDetail.exerciseName).isEqualTo("Bench Press")
        assertThat(exDetail.setsExpected).isEqualTo(3)
        assertThat(exDetail.concentricLoad).isEqualByComparingTo(BigDecimal("60.00"))
        assertThat(exDetail.exercise.modality).isEqualTo("LIVRE")
        assertThat(exDetail.result).isNotNull
        assertThat(exDetail.result!!.sets).isEqualTo(3)
        assertThat(exDetail.result!!.concentricLoad).isEqualByComparingTo(BigDecimal("60.00"))
    }

    @Test
    fun `findDetailById with no results`() {
        val workout = createWorkout()
        val exercise = Exercise(id = UUID.randomUUID(), name = "Squat", hasSets = true, modality = Modality.LIVRE)
        val we = WorkoutExercise(id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise)

        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns null

        val result = service.findDetailById(workout.id!!)

        assertThat(result.exercises[0].result).isNull()
    }

    @Test
    fun `create validates athlete exists and returns summary`() {
        val request = CreateWorkoutRequest(
            athleteId = athlete.id!!,
            label = "Push Day",
            date = today,
            notes = "Focus on chest",
            scheduledTime = LocalTime.of(9, 0)
        )

        every { athleteRepository.findById(athlete.id!!) } returns Optional.of(athlete)
        every { workoutRepository.save(any()) } answers {
            val w = firstArg<Workout>()
            Workout(
                id = UUID.randomUUID(), label = w.label, date = w.date,
                notes = w.notes, scheduledTime = w.scheduledTime, athlete = w.athlete
            )
        }

        val result = service.create(request)

        assertThat(result.label).isEqualTo("Push Day")
        assertThat(result.athleteId).isEqualTo(athlete.id)
        assertThat(result.coachName).isEqualTo("Coach A")
        assertThat(result.notes).isEqualTo("Focus on chest")
        assertThat(result.scheduledTime).isEqualTo(LocalTime.of(9, 0))
        verify { workoutRepository.save(any()) }
    }

    @Test
    fun `create throws when athlete not found`() {
        val badAthleteId = UUID.randomUUID()
        val request = CreateWorkoutRequest(athleteId = badAthleteId, label = "Day", date = today)

        every { athleteRepository.findById(badAthleteId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.create(request)
        }
    }

    @Test
    fun `updateStatus with valid status`() {
        val workout = createWorkout()
        val request = UpdateWorkoutStatusRequest(status = "COMPLETED")

        every { workoutRepository.findById(workout.id!!) } returns Optional.of(workout)
        every { workoutRepository.save(any()) } answers { firstArg() }
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.updateStatus(workout.id!!, request)

        assertThat(result.status).isEqualTo("COMPLETED")
        verify { workoutRepository.save(workout) }
    }

    @Test
    fun `updateStatus with invalid status throws BusinessRuleException`() {
        val workout = createWorkout()
        val request = UpdateWorkoutStatusRequest(status = "INVALID")

        assertThrows<BusinessRuleException> {
            service.updateStatus(workout.id!!, request)
        }
    }

    @Test
    fun `delete removes workout when found`() {
        val id = UUID.randomUUID()
        every { workoutRepository.existsById(id) } returns true
        every { workoutRepository.deleteById(id) } just Runs

        service.delete(id)

        verify { workoutRepository.deleteById(id) }
    }

    @Test
    fun `delete throws when workout not found`() {
        val id = UUID.randomUUID()
        every { workoutRepository.existsById(id) } returns false

        assertThrows<ResourceNotFoundException> {
            service.delete(id)
        }
    }
}
