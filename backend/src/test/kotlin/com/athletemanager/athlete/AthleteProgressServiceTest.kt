package com.athletemanager.athlete

import com.athletemanager.coach.Coach
import com.athletemanager.exercise.Exercise
import com.athletemanager.exercise.KineoType
import com.athletemanager.exercise.Modality
import com.athletemanager.exerciseresult.ExerciseResult
import com.athletemanager.exerciseresult.ExerciseResultRepository
import com.athletemanager.workout.Workout
import com.athletemanager.workout.WorkoutRepository
import com.athletemanager.workoutexercise.WorkoutExercise
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@ExtendWith(MockKExtension::class)
class AthleteProgressServiceTest {

    @MockK
    private lateinit var athleteService: AthleteService

    @MockK
    private lateinit var workoutRepository: WorkoutRepository

    @MockK
    private lateinit var workoutExerciseRepository: WorkoutExerciseRepository

    @MockK
    private lateinit var exerciseResultRepository: ExerciseResultRepository

    @InjectMockKs
    private lateinit var service: AthleteProgressService

    private val coach = Coach(id = UUID.randomUUID(), name = "Coach A")
    private val athlete = Athlete(id = UUID.randomUUID(), name = "Athlete A", email = "a@test.com", coach = coach)
    private val athleteResponse = AthleteResponse(
        id = athlete.id!!, name = athlete.name, dateOfBirth = null,
        coachId = coach.id!!, coachName = coach.name, notes = null,
        email = athlete.email, weightKg = null, heightCm = null
    )

    private fun createWorkout(status: String = "PENDING", scheduledTime: LocalTime? = null) = Workout(
        id = UUID.randomUUID(), label = "Workout", date = LocalDate.now(),
        athlete = athlete, status = status, scheduledTime = scheduledTime
    )

    @Test
    fun `getProgress with date range`() {
        val startDate = LocalDate.now().minusDays(7)
        val endDate = LocalDate.now()
        val workout = createWorkout(status = "COMPLETED")

        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdAndDateBetween(athlete.id!!, startDate, endDate) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.getProgress(athlete.id!!, startDate, endDate)

        assertThat(result.athlete.id).isEqualTo(athlete.id)
        assertThat(result.workouts).hasSize(1)
        verify { workoutRepository.findByAthleteIdAndDateBetween(athlete.id!!, startDate, endDate) }
    }

    @Test
    fun `getProgress without date range`() {
        val workout = createWorkout(status = "COMPLETED")

        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns emptyList()

        val result = service.getProgress(athlete.id!!, null, null)

        assertThat(result.workouts).hasSize(1)
        verify { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) }
    }

    @Test
    fun `stats calculation with completedCount, missedCount, and completionRate`() {
        val completed1 = createWorkout(status = "COMPLETED")
        val completed2 = createWorkout(status = "COMPLETED")
        val missed = createWorkout(status = "MISSED")
        val pending = createWorkout(status = "PENDING")

        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) } returns
                listOf(completed1, completed2, missed, pending)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(any()) } returns emptyList()

        val result = service.getProgress(athlete.id!!, null, null)

        assertThat(result.stats.totalWorkouts).isEqualTo(4)
        assertThat(result.stats.completedCount).isEqualTo(2)
        assertThat(result.stats.missedCount).isEqualTo(1)
        assertThat(result.stats.pendingCount).isEqualTo(1)
        assertThat(result.stats.completionRate).isEqualTo(50.0)
    }

    @Test
    fun `exercise progress items include expected and actual loads`() {
        val workout = createWorkout(status = "COMPLETED")
        val exercise = Exercise(
            id = UUID.randomUUID(), name = "Leg Press",
            hasSets = true, hasReps = true, hasWeight = true,
            modality = Modality.KINEO, kineoType = KineoType.ISOTONICO
        )
        val we = WorkoutExercise(
            id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise,
            setsExpected = 4, repsExpected = 12, weightExpected = BigDecimal("200.00"),
            concentricLoad = BigDecimal("150.00"), eccentricLoad = BigDecimal("160.00"),
            isometricLoad = BigDecimal("140.00")
        )
        val er = ExerciseResult(
            id = UUID.randomUUID(), workoutExercise = we,
            sets = 4, reps = 12, weight = BigDecimal("200.00"),
            concentricLoad = BigDecimal("155.00"), eccentricLoad = BigDecimal("165.00"),
            isometricLoad = BigDecimal("145.00")
        )

        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns er

        val result = service.getProgress(athlete.id!!, null, null)

        val item = result.workouts[0].exercises[0]
        assertThat(item.exerciseName).isEqualTo("Leg Press")
        assertThat(item.modality).isEqualTo("KINEO")
        assertThat(item.kineoType).isEqualTo("ISOTONICO")
        assertThat(item.setsExpected).isEqualTo(4)
        assertThat(item.concentricLoadExpected).isEqualByComparingTo(BigDecimal("150.00"))
        assertThat(item.eccentricLoadExpected).isEqualByComparingTo(BigDecimal("160.00"))
        assertThat(item.isometricLoadExpected).isEqualByComparingTo(BigDecimal("140.00"))
        assertThat(item.setsActual).isEqualTo(4)
        assertThat(item.concentricLoadActual).isEqualByComparingTo(BigDecimal("155.00"))
        assertThat(item.eccentricLoadActual).isEqualByComparingTo(BigDecimal("165.00"))
        assertThat(item.isometricLoadActual).isEqualByComparingTo(BigDecimal("145.00"))
        assertThat(item.hasResult).isTrue()
    }

    @Test
    fun `exercise progress items without result`() {
        val workout = createWorkout(status = "PENDING")
        val exercise = Exercise(id = UUID.randomUUID(), name = "Squat", hasSets = true, modality = Modality.LIVRE)
        val we = WorkoutExercise(
            id = UUID.randomUUID(), orderIndex = 0, workout = workout, exercise = exercise,
            setsExpected = 3, repsExpected = 8
        )

        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) } returns listOf(workout)
        every { workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!) } returns listOf(we)
        every { exerciseResultRepository.findByWorkoutExerciseId(we.id!!) } returns null

        val result = service.getProgress(athlete.id!!, null, null)

        val item = result.workouts[0].exercises[0]
        assertThat(item.hasResult).isFalse()
        assertThat(item.setsActual).isNull()
        assertThat(item.concentricLoadActual).isNull()
    }

    @Test
    fun `empty workouts returns zero stats`() {
        every { athleteService.findById(athlete.id!!) } returns athleteResponse
        every { workoutRepository.findByAthleteIdOrderByDateDesc(athlete.id!!) } returns emptyList()

        val result = service.getProgress(athlete.id!!, null, null)

        assertThat(result.stats.totalWorkouts).isEqualTo(0)
        assertThat(result.stats.completedCount).isEqualTo(0)
        assertThat(result.stats.missedCount).isEqualTo(0)
        assertThat(result.stats.pendingCount).isEqualTo(0)
        assertThat(result.stats.completionRate).isEqualTo(0.0)
        assertThat(result.workouts).isEmpty()
    }
}
