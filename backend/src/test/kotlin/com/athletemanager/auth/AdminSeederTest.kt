package com.athletemanager.auth

import io.mockk.*
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.security.crypto.password.PasswordEncoder

@ExtendWith(MockKExtension::class)
class AdminSeederTest {

    @MockK
    private lateinit var appUserRepository: AppUserRepository

    @MockK
    private lateinit var passwordEncoder: PasswordEncoder

    @Test
    fun `creates admin user when no users exist`() {
        every { appUserRepository.count() } returns 0
        every { passwordEncoder.encode("admin") } returns "hashed-admin"
        every { appUserRepository.save(any()) } answers { firstArg() }

        val seeder = AdminSeeder(appUserRepository, passwordEncoder, "admin", "admin")
        seeder.run(null)

        verify {
            appUserRepository.save(match {
                it.username == "admin" &&
                    it.passwordHash == "hashed-admin" &&
                    it.role == Role.ADMIN &&
                    it.enabled
            })
        }
    }

    @Test
    fun `skips seeding when users already exist`() {
        every { appUserRepository.count() } returns 1

        val seeder = AdminSeeder(appUserRepository, passwordEncoder, "admin", "admin")
        seeder.run(null)

        verify(exactly = 0) { appUserRepository.save(any()) }
    }
}
