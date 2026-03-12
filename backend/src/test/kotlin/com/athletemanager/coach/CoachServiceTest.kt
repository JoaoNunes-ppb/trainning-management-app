package com.athletemanager.coach

import com.athletemanager.common.exception.ResourceNotFoundException
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
class CoachServiceTest {

    @MockK
    private lateinit var coachRepository: CoachRepository

    @InjectMockKs
    private lateinit var service: CoachService

    private fun createCoach(id: UUID = UUID.randomUUID(), name: String = "Coach A") =
        Coach(id = id, name = name)

    @Test
    fun `findAll returns mapped responses`() {
        val coach1 = createCoach(name = "Coach A")
        val coach2 = createCoach(name = "Coach B")

        every { coachRepository.findAll() } returns listOf(coach1, coach2)

        val result = service.findAll()

        assertThat(result).hasSize(2)
        assertThat(result[0].name).isEqualTo("Coach A")
        assertThat(result[1].name).isEqualTo("Coach B")
        verify { coachRepository.findAll() }
    }

    @Test
    fun `findById returns response when found`() {
        val coach = createCoach()

        every { coachRepository.findById(coach.id!!) } returns Optional.of(coach)

        val result = service.findById(coach.id!!)

        assertThat(result.id).isEqualTo(coach.id)
        assertThat(result.name).isEqualTo("Coach A")
    }

    @Test
    fun `findById throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()

        every { coachRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.findById(id)
        }
    }

    @Test
    fun `create saves and returns response`() {
        val request = CreateCoachRequest(name = "New Coach")

        every { coachRepository.save(any()) } answers {
            val c = firstArg<Coach>()
            Coach(id = UUID.randomUUID(), name = c.name)
        }

        val result = service.create(request)

        assertThat(result.name).isEqualTo("New Coach")
        assertThat(result.id).isNotNull()
        verify { coachRepository.save(any()) }
    }

    @Test
    fun `update finds, updates name, saves, and returns response`() {
        val coach = createCoach()
        val request = CreateCoachRequest(name = "Updated Name")

        every { coachRepository.findById(coach.id!!) } returns Optional.of(coach)
        every { coachRepository.save(any()) } answers { firstArg() }

        val result = service.update(coach.id!!, request)

        assertThat(result.name).isEqualTo("Updated Name")
        verify { coachRepository.save(coach) }
    }

    @Test
    fun `update throws ResourceNotFoundException when not found`() {
        val id = UUID.randomUUID()
        val request = CreateCoachRequest(name = "Updated")

        every { coachRepository.findById(id) } returns Optional.empty()

        assertThrows<ResourceNotFoundException> {
            service.update(id, request)
        }
    }

    @Test
    fun `delete calls deleteById when exists`() {
        val id = UUID.randomUUID()

        every { coachRepository.existsById(id) } returns true
        every { coachRepository.deleteById(id) } just Runs

        service.delete(id)

        verify { coachRepository.deleteById(id) }
    }

    @Test
    fun `delete throws ResourceNotFoundException when not exists`() {
        val id = UUID.randomUUID()

        every { coachRepository.existsById(id) } returns false

        assertThrows<ResourceNotFoundException> {
            service.delete(id)
        }
    }
}
