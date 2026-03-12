package com.athletemanager.athlete

import com.athletemanager.coach.Coach
import com.athletemanager.coach.CoachRepository
import com.athletemanager.common.exception.ResourceNotFoundException
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
class AthleteServiceTest {

    @MockK
    private lateinit var athleteRepository: AthleteRepository

    @MockK
    private lateinit var coachRepository: CoachRepository

    @InjectMockKs
    private lateinit var service: AthleteService

    private val coach = Coach(id = UUID.randomUUID(), name = "Coach A")

    private fun createAthlete(
        id: UUID = UUID.randomUUID(),
        name: String = "Athlete A",
        email: String = "a@test.com",
        dateOfBirth: LocalDate? = LocalDate.of(2000, 1, 1),
        notes: String? = "Some notes",
        weightKg: BigDecimal? = BigDecimal("75.00"),
        heightCm: Int? = 180
    ) = Athlete(
        id = id,
        name = name,
        email = email,
        dateOfBirth = dateOfBirth,
        notes = notes,
        weightKg = weightKg,
        heightCm = heightCm,
        coach = coach
    )

    @Test
    fun `findAll without coachId returns all athletes`() {
        val athlete1 = createAthlete(name = "Athlete A")
        val athlete2 = createAthlete(name = "Athlete B")

        every { athleteRepository.findAll() } returns listOf(athlete1, athlete2)

        val result = service.findAll(coachId = null)

        assertThat(result).hasSize(2)
        assertThat(result[0].name).isEqualTo("Athlete A")
        assertThat(result[1].name).isEqualTo("Athlete B")
        verify { athleteRepository.findAll() }
    }

    @Test
    fun `findAll with coachId filters by coach`() {
        val athlete = createAthlete()

        every { athleteRepository.findByCoachId(coach.id!!) } returns listOf(athlete)

        val result = service.findAll(coachId = coach.id)

        assertThat(result).hasSize(1)
        assertThat(result[0].coachId).isEqualTo(coach.id)
        verify { athleteRepository.findByCoachId(coach.id!!) }
    }

    @Test
    fun `findById returns response when found`() {
        val athlete = createAthlete()

        every { athleteRepository.findById(athlete.id!!) } returns Optional.of(athlete)

        val result = service.findById(athlete.id!!)

        assertThat(result.id).isEqualTo(athlete.id)
        assertThat(result.name).isEqualTo("Athlete A")
        assertThat(result.coachId).isEqualTo(coach.id)
        assertThat(result.coachName).isEqualTo("Coach A")
        assertThat(result.email).isEqualTo("a@test.com")
        assertThat(result.weightKg).isEqualByComparingTo(BigDecimal("75.00"))
        assertThat(result.heightCm).isEqualTo(180)
    }

    @Test
    fun `findById throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()

        every { athleteRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.findById(id)
        }
    }

    @Test
    fun `create looks up coach, creates athlete, and returns response`() {
        val request = CreateAthleteRequest(
            name = "New Athlete",
            dateOfBirth = LocalDate.of(1995, 6, 15),
            coachId = coach.id!!,
            notes = "Beginner",
            email = "new@test.com",
            weightKg = BigDecimal("80.00"),
            heightCm = 175
        )

        every { coachRepository.findById(coach.id!!) } returns Optional.of(coach)
        every { athleteRepository.save(any()) } answers {
            val a = firstArg<Athlete>()
            Athlete(
                id = UUID.randomUUID(),
                name = a.name,
                dateOfBirth = a.dateOfBirth,
                notes = a.notes,
                email = a.email,
                weightKg = a.weightKg,
                heightCm = a.heightCm,
                coach = a.coach
            )
        }

        val result = service.create(request)

        assertThat(result.name).isEqualTo("New Athlete")
        assertThat(result.email).isEqualTo("new@test.com")
        assertThat(result.coachId).isEqualTo(coach.id)
        assertThat(result.coachName).isEqualTo("Coach A")
        assertThat(result.dateOfBirth).isEqualTo(LocalDate.of(1995, 6, 15))
        verify { coachRepository.findById(coach.id!!) }
        verify { athleteRepository.save(any()) }
    }

    @Test
    fun `create throws ResourceNotFoundException when coach not found`() {
        val badCoachId = UUID.randomUUID()
        val request = CreateAthleteRequest(
            name = "Athlete",
            coachId = badCoachId,
            email = "test@test.com"
        )

        every { coachRepository.findById(badCoachId) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.create(request)
        }
    }

    @Test
    fun `update finds athlete and coach, updates fields, and returns response`() {
        val athlete = createAthlete()
        val newCoach = Coach(id = UUID.randomUUID(), name = "Coach B")
        val request = CreateAthleteRequest(
            name = "Updated Name",
            dateOfBirth = LocalDate.of(1998, 3, 20),
            coachId = newCoach.id!!,
            notes = "Updated notes",
            email = "updated@test.com",
            weightKg = BigDecimal("85.00"),
            heightCm = 185
        )

        every { athleteRepository.findById(athlete.id!!) } returns Optional.of(athlete)
        every { coachRepository.findById(newCoach.id!!) } returns Optional.of(newCoach)
        every { athleteRepository.save(any()) } answers { firstArg() }

        val result = service.update(athlete.id!!, request)

        assertThat(result.name).isEqualTo("Updated Name")
        assertThat(result.email).isEqualTo("updated@test.com")
        assertThat(result.coachId).isEqualTo(newCoach.id)
        assertThat(result.coachName).isEqualTo("Coach B")
        assertThat(result.heightCm).isEqualTo(185)
        verify { athleteRepository.save(athlete) }
    }

    @Test
    fun `update throws ResourceNotFoundException when athlete not found`() {
        val id = UUID.randomUUID()
        val request = CreateAthleteRequest(
            name = "Name",
            coachId = coach.id!!,
            email = "test@test.com"
        )

        every { athleteRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.update(id, request)
        }
    }

    @Test
    fun `delete calls deleteById when exists`() {
        val id = UUID.randomUUID()

        every { athleteRepository.existsById(id) } returns true
        every { athleteRepository.deleteById(id) } just Runs

        service.delete(id)

        verify { athleteRepository.deleteById(id) }
    }

    @Test
    fun `delete throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()

        every { athleteRepository.existsById(id) } returns false

        assertThrows<ResourceNotFoundException> {
            service.delete(id)
        }
    }
}
