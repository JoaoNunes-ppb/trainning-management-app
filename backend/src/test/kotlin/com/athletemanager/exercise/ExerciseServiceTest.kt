package com.athletemanager.exercise

import com.athletemanager.common.exception.BusinessRuleException
import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.util.*

@ExtendWith(MockKExtension::class)
class ExerciseServiceTest {

    @MockK
    private lateinit var exerciseRepository: ExerciseRepository

    @MockK
    private lateinit var workoutExerciseRepository: WorkoutExerciseRepository

    @InjectMockKs
    private lateinit var service: ExerciseService

    private fun createExercise(
        id: UUID = UUID.randomUUID(),
        name: String = "Squat",
        modality: Modality = Modality.LIVRE,
        kineoType: KineoType? = null,
        hasSets: Boolean = true,
        hasReps: Boolean = true,
        hasWeight: Boolean = true,
        hasDistance: Boolean = false,
        hasTime: Boolean = false
    ) = Exercise(
        id = id,
        name = name,
        modality = modality,
        kineoType = kineoType,
        hasSets = hasSets,
        hasReps = hasReps,
        hasWeight = hasWeight,
        hasDistance = hasDistance,
        hasTime = hasTime
    )

    @Test
    fun `findAll returns mapped responses`() {
        val ex1 = createExercise(name = "Squat")
        val ex2 = createExercise(name = "Bench Press")

        every { exerciseRepository.findAll() } returns listOf(ex1, ex2)

        val result = service.findAll()

        assertThat(result).hasSize(2)
        assertThat(result[0].name).isEqualTo("Squat")
        assertThat(result[1].name).isEqualTo("Bench Press")
        verify { exerciseRepository.findAll() }
    }

    @Test
    fun `findById returns response when found`() {
        val exercise = createExercise()

        every { exerciseRepository.findById(exercise.id!!) } returns Optional.of(exercise)

        val result = service.findById(exercise.id!!)

        assertThat(result.id).isEqualTo(exercise.id)
        assertThat(result.name).isEqualTo("Squat")
        assertThat(result.modality).isEqualTo(Modality.LIVRE)
        assertThat(result.hasSets).isTrue()
    }

    @Test
    fun `findById throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()

        every { exerciseRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.findById(id)
        }
    }

    @Test
    fun `create with LIVRE modality succeeds`() {
        val request = CreateExerciseRequest(
            name = "Deadlift",
            description = "Compound lift",
            hasSets = true,
            hasReps = true,
            hasWeight = true,
            modality = Modality.LIVRE
        )

        every { exerciseRepository.save(any()) } answers {
            val e = firstArg<Exercise>()
            Exercise(
                id = UUID.randomUUID(),
                name = e.name,
                description = e.description,
                hasSets = e.hasSets,
                hasReps = e.hasReps,
                hasWeight = e.hasWeight,
                hasDistance = e.hasDistance,
                hasTime = e.hasTime,
                modality = e.modality,
                kineoType = e.kineoType
            )
        }

        val result = service.create(request)

        assertThat(result.name).isEqualTo("Deadlift")
        assertThat(result.description).isEqualTo("Compound lift")
        assertThat(result.modality).isEqualTo(Modality.LIVRE)
        assertThat(result.kineoType).isNull()
        verify { exerciseRepository.save(any()) }
    }

    @Test
    fun `create with KINEO and valid kineoType succeeds`() {
        val request = CreateExerciseRequest(
            name = "Kineo Leg Press",
            hasSets = true,
            hasReps = true,
            hasWeight = true,
            modality = Modality.KINEO,
            kineoType = KineoType.ISOTONICO
        )

        every { exerciseRepository.save(any()) } answers {
            val e = firstArg<Exercise>()
            Exercise(
                id = UUID.randomUUID(),
                name = e.name,
                description = e.description,
                hasSets = e.hasSets,
                hasReps = e.hasReps,
                hasWeight = e.hasWeight,
                hasDistance = e.hasDistance,
                hasTime = e.hasTime,
                modality = e.modality,
                kineoType = e.kineoType
            )
        }

        val result = service.create(request)

        assertThat(result.modality).isEqualTo(Modality.KINEO)
        assertThat(result.kineoType).isEqualTo(KineoType.ISOTONICO)
        verify { exerciseRepository.save(any()) }
    }

    @Test
    fun `create with KINEO and null kineoType throws BusinessRuleException`() {
        val request = CreateExerciseRequest(
            name = "Bad Kineo",
            hasSets = true,
            modality = Modality.KINEO,
            kineoType = null
        )

        assertThrows<BusinessRuleException> {
            service.create(request)
        }
    }

    @Test
    fun `create with no parameters enabled throws BusinessRuleException`() {
        val request = CreateExerciseRequest(
            name = "No Params",
            hasSets = false,
            hasReps = false,
            hasWeight = false,
            hasDistance = false,
            hasTime = false,
            modality = Modality.LIVRE
        )

        assertThrows<BusinessRuleException> {
            service.create(request)
        }
    }

    @Test
    fun `update finds exercise, updates fields, and returns response`() {
        val exercise = createExercise()
        val request = CreateExerciseRequest(
            name = "Updated Squat",
            description = "Deep squat",
            hasSets = true,
            hasReps = true,
            hasWeight = true,
            hasDistance = false,
            hasTime = false,
            modality = Modality.LIVRE
        )

        every { exerciseRepository.findById(exercise.id!!) } returns Optional.of(exercise)
        every { exerciseRepository.save(any()) } answers { firstArg() }

        val result = service.update(exercise.id!!, request)

        assertThat(result.name).isEqualTo("Updated Squat")
        assertThat(result.description).isEqualTo("Deep squat")
        verify { exerciseRepository.save(exercise) }
    }

    @Test
    fun `update throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()
        val request = CreateExerciseRequest(
            name = "Name",
            hasSets = true,
            modality = Modality.LIVRE
        )

        every { exerciseRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.update(id, request)
        }
    }

    @Test
    fun `delete succeeds when exercise exists and not in use`() {
        val id = UUID.randomUUID()

        every { exerciseRepository.existsById(id) } returns true
        every { workoutExerciseRepository.countByExerciseId(id) } returns 0L
        every { exerciseRepository.deleteById(id) } just Runs

        service.delete(id)

        verify { exerciseRepository.deleteById(id) }
    }

    @Test
    fun `delete throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()

        every { exerciseRepository.existsById(id) } returns false

        assertThrows<ResourceNotFoundException> {
            service.delete(id)
        }
    }

    @Test
    fun `delete throws BusinessRuleException when exercise is in use`() {
        val id = UUID.randomUUID()

        every { exerciseRepository.existsById(id) } returns true
        every { workoutExerciseRepository.countByExerciseId(id) } returns 3L

        assertThrows<BusinessRuleException> {
            service.delete(id)
        }
    }
}
